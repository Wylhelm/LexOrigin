"""
RAG Engine for LexOrigin - Canadian Immigration Law Analysis

Uses ChromaDB for vector storage and Ollama for LLM inference.
Model: gpt-oss:20b-cloud
"""

import os
import json
import chromadb
from chromadb.utils import embedding_functions
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from typing import List, Dict, Any, Optional
from .models import AnalysisResponse, LawArticle, DebateExcerpt, SearchResult
from .prompts import SYSTEM_PROMPT, FUZZY_SEARCH_PROMPT, DIRECT_QUERY_PROMPT

# Configuration
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gpt-oss:120b-cloud")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
CHROMA_DB_PATH = os.path.join(os.path.dirname(__file__), "database")


class RAGEngine:
    def __init__(self):
        """Initialize the RAG Engine with ChromaDB and Ollama."""
        print(f"Initializing RAG Engine with model: {OLLAMA_MODEL}")
        
        # Initialize ChromaDB
        self.chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
        
        # Use Default Embedding Function (sentence-transformers/all-MiniLM-L6-v2)
        self.embedding_fn = embedding_functions.DefaultEmbeddingFunction()

        # Create collections
        self.laws_collection = self.chroma_client.get_or_create_collection(
            name="legal_texts",
            embedding_function=self.embedding_fn,
            metadata={"description": "Canadian Immigration Laws and Regulations"}
        )
        
        self.debates_collection = self.chroma_client.get_or_create_collection(
            name="hansard_debates",
            embedding_function=self.embedding_fn,
            metadata={"description": "Parliamentary Debates on Immigration"}
        )

        # Initialize Ollama LLM
        try:
            self.llm = ChatOllama(
                model=OLLAMA_MODEL,
                base_url=OLLAMA_BASE_URL,
                temperature=0.1,
                num_predict=2048,
            )
            print(f"Ollama LLM initialized: {OLLAMA_MODEL}")
        except Exception as e:
            print(f"Warning: Could not initialize Ollama: {e}")
            self.llm = None

    def ingest_laws(self, laws_file: str):
        """Ingest immigration laws from JSON file into ChromaDB."""
        if not os.path.exists(laws_file):
            print(f"Laws file not found: {laws_file}")
            return 0
            
        with open(laws_file, 'r', encoding='utf-8') as f:
            laws = json.load(f)

        if not laws:
            print("No laws to ingest")
            return 0

        # Batch upsert for efficiency
        ids = [law["id"] for law in laws]
        documents = [law["document"] for law in laws]
        metadatas = [law["metadata"] for law in laws]
        
        self.laws_collection.upsert(ids=ids, documents=documents, metadatas=metadatas)
        print(f"Ingested {len(laws)} law sections into 'legal_texts' collection")
        return len(laws)

    def ingest_debates(self, debates_file: str):
        """Ingest Hansard debates from JSON file into ChromaDB."""
        if not os.path.exists(debates_file):
            print(f"Debates file not found: {debates_file}")
            return 0
            
        with open(debates_file, 'r', encoding='utf-8') as f:
            debates = json.load(f)

        if not debates:
            print("No debates to ingest")
            return 0

        # Batch upsert for efficiency
        ids = [debate["id"] for debate in debates]
        documents = [debate["document"] for debate in debates]
        metadatas = [debate["metadata"] for debate in debates]
        
        self.debates_collection.upsert(ids=ids, documents=documents, metadatas=metadatas)
        print(f"Ingested {len(debates)} debates into 'hansard_debates' collection")
        return len(debates)

    def ingest_data(self, seed_file: str):
        """Legacy method: Ingest from seed_data.json format."""
        if not os.path.exists(seed_file):
            print(f"Seed file not found: {seed_file}")
            return
            
        with open(seed_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Ingest Laws
        laws = data.get("laws", [])
        if laws:
            ids = [law["id"] for law in laws]
            documents = [law["document"] for law in laws]
            metadatas = [law["metadata"] for law in laws]
            self.laws_collection.upsert(ids=ids, documents=documents, metadatas=metadatas)
            print(f"Ingested {len(laws)} laws from seed file.")

        # Ingest Debates
        debates = data.get("debates", [])
        if debates:
            ids = [debate["id"] for debate in debates]
            documents = [debate["document"] for debate in debates]
            metadatas = [debate["metadata"] for debate in debates]
            self.debates_collection.upsert(ids=ids, documents=documents, metadatas=metadatas)
            print(f"Ingested {len(debates)} debates from seed file.")

    def fuzzy_search_laws(self, query: str, n_results: int = 10, use_ai: bool = True) -> List[Dict]:
        """
        Fuzzy search for laws using semantic similarity.
        Optionally enhance with AI for better query understanding.
        """
        # If AI is enabled, first enhance the query
        enhanced_query = query
        if use_ai and self.llm:
            try:
                enhance_prompt = ChatPromptTemplate.from_messages([
                    ("system", "You are a legal search assistant. Rewrite the user's query to be more precise for searching Canadian immigration laws. Output only the enhanced query, nothing else."),
                    ("user", "{query}")
                ])
                chain = enhance_prompt | self.llm | StrOutputParser()
                enhanced_query = chain.invoke({"query": query})
                print(f"Enhanced query: {enhanced_query}")
            except Exception as e:
                print(f"Query enhancement failed: {e}")
                enhanced_query = query

        # Perform semantic search
        results = self.laws_collection.query(
            query_texts=[enhanced_query],
            n_results=n_results
        )
        
        search_results = []
        if results['documents'] and results['documents'][0]:
            for i, doc in enumerate(results['documents'][0]):
                meta = results['metadatas'][0][i]
                distance = results['distances'][0][i] if 'distances' in results else None
                
                search_results.append({
                    "id": results['ids'][0][i],
                    "document": doc,
                    "metadata": meta,
                    "relevance_score": 1 - (distance / 2) if distance else 0.5  # Convert distance to similarity
                })
        
        return search_results

    def direct_ai_query(self, question: str) -> Dict:
        """
        Directly query the AI about immigration law, then analyze the response.
        Returns both the AI answer and structured analysis.
        """
        if not self.llm:
            return {
                "answer": "AI is not available. Please check Ollama configuration.",
                "sources": [],
                "confidence": 0
            }

        # First, get relevant context from the database
        law_context = self.fuzzy_search_laws(question, n_results=5, use_ai=False)
        debate_context = self.search_debates(question, n_results=3)
        
        # Build context string
        context_parts = []
        if law_context:
            context_parts.append("RELEVANT LAWS:")
            for law in law_context:
                context_parts.append(f"[{law['id']}] {law['metadata'].get('law_name', 'Unknown')}: {law['document'][:500]}")
        
        if debate_context:
            context_parts.append("\nRELEVANT DEBATES:")
            for debate in debate_context:
                meta = debate['metadata']
                context_parts.append(f"[{meta.get('speaker_name', 'Unknown')} - {meta.get('party', 'Unknown')}]: {debate['document'][:300]}")
        
        context_str = "\n".join(context_parts)

        # Query the AI with context
        prompt = ChatPromptTemplate.from_messages([
            ("system", DIRECT_QUERY_PROMPT),
            ("user", "Question: {question}\n\nContext:\n{context}")
        ])
        
        try:
            chain = prompt | self.llm | StrOutputParser()
            answer = chain.invoke({
                "question": question,
                "context": context_str
            })
            
            return {
                "answer": answer,
                "sources": [
                    {"type": "law", "id": law['id'], "relevance": law.get('relevance_score', 0)}
                    for law in law_context[:3]
                ] + [
                    {"type": "debate", "speaker": d['metadata'].get('speaker_name', 'Unknown')}
                    for d in debate_context[:2]
                ],
                "confidence": 0.8 if law_context else 0.5
            }
        except Exception as e:
            print(f"Direct AI query failed: {e}")
            return {
                "answer": f"Error processing query: {str(e)}",
                "sources": [],
                "confidence": 0
            }

    def search_debates(self, query: str, n_results: int = 5, 
                       party_filter: str = None, 
                       date_from: str = None,
                       date_to: str = None) -> List[Dict]:
        """Search debates with optional filters."""
        # Build where clause for metadata filtering
        where_clause = None
        if party_filter:
            where_clause = {"party": party_filter}
        
        results = self.debates_collection.query(
            query_texts=[query],
            n_results=n_results,
            where=where_clause
        )
        
        search_results = []
        if results['documents'] and results['documents'][0]:
            for i, doc in enumerate(results['documents'][0]):
                meta = results['metadatas'][0][i]
                
                # Apply date filtering post-query if needed
                if date_from and meta.get('date', '') < date_from:
                    continue
                if date_to and meta.get('date', '') > date_to:
                    continue
                    
                search_results.append({
                    "id": results['ids'][0][i],
                    "document": doc,
                    "metadata": meta
                })
        
        return search_results

    def analyze_intent(self, law_text: str, law_context: str = None) -> AnalysisResponse:
        """Analyzes legislative intent using RAG."""
        
        # 1. Retrieve relevant debates
        results = self.debates_collection.query(
            query_texts=[law_text],
            n_results=5
        )
        
        # Format context from results
        context_str = ""
        retrieved_debates = []
        
        if results['documents'] and results['documents'][0]:
            for i, doc in enumerate(results['documents'][0]):
                meta = results['metadatas'][0][i]
                context_str += f"Speaker: {meta.get('speaker_name', 'Unknown')}\n"
                context_str += f"Party: {meta.get('party', 'Unknown')}\n"
                context_str += f"Date: {meta.get('date', 'Unknown')}\n"
                context_str += f"Topic: {meta.get('topic', 'General')}\n"
                context_str += f"Text: {doc}\n\n"
                
                retrieved_debates.append({
                    "speaker": meta.get('speaker_name', 'Unknown'),
                    "party": meta.get('party', 'Unknown'),
                    "date": meta.get('date', 'Unknown'),
                    "text": doc,
                    "sentiment": meta.get('sentiment_score', 0.0)
                })

        # 2. Also retrieve relevant law sections for context
        law_results = self.laws_collection.query(
            query_texts=[law_text],
            n_results=3
        )
        
        if law_results['documents'] and law_results['documents'][0]:
            context_str += "\nRELATED LAW SECTIONS:\n"
            for i, doc in enumerate(law_results['documents'][0]):
                meta = law_results['metadatas'][0][i]
                context_str += f"[{meta.get('law_code', '')}-{meta.get('section', '')}] {doc[:300]}...\n\n"

        # 3. Call LLM for analysis
        if self.llm:
            prompt = ChatPromptTemplate.from_messages([
                ("system", SYSTEM_PROMPT),
                ("user", "Law Text: {law_text}\n\nContext (Debates and Related Laws):\n{context}")
            ])
            
            try:
                # Try JSON parsing first
                chain = prompt | self.llm | JsonOutputParser()
                response = chain.invoke({
                    "law_text": law_text,
                    "context": context_str
                })
                
                # Ensure response has required fields
                return AnalysisResponse(
                    summary=response.get("summary", "Analysis not available"),
                    controversy_level=response.get("controversy_level", "Unknown"),
                    consensus_color=response.get("consensus_color", "gray"),
                    citations=response.get("citations", retrieved_debates[:3]),
                    key_arguments=response.get("key_arguments", [])
                )
            except Exception as e:
                print(f"JSON parsing failed, trying string output: {e}")
                
                # Fallback to string output
                try:
                    chain = prompt | self.llm | StrOutputParser()
                    response_text = chain.invoke({
                        "law_text": law_text,
                        "context": context_str
                    })
                    
                    return AnalysisResponse(
                        summary=response_text,
                        controversy_level="Medium",
                        consensus_color="yellow",
                        citations=retrieved_debates[:3],
                        key_arguments=["See summary for details"]
                    )
                except Exception as e2:
                    print(f"LLM analysis failed completely: {e2}")
        
        # Fallback Mock Response
        print("Using fallback mock response for analysis.")
        return AnalysisResponse(
            summary="[ANALYSIS UNAVAILABLE] The AI model is not responding. Based on retrieved debates, the legislative intent appears focused on balancing immigration facilitation with security concerns.",
            controversy_level="Medium",
            consensus_color="yellow",
            citations=retrieved_debates[:3],
            key_arguments=[
                "Immigration efficiency vs security trade-offs",
                "Family reunification priorities",
                "Processing time concerns"
            ]
        )

    def get_timeline_events(self, law_id: str = None, topic: str = None) -> List[Dict]:
        """Get timeline of debate events, optionally filtered."""
        
        # Query all debates or filter by topic
        if topic:
            results = self.debates_collection.query(
                query_texts=[topic],
                n_results=50
            )
        else:
            results = self.debates_collection.get(limit=100)
        
        events = []
        ids = results.get('ids', [])
        if isinstance(ids[0], list):
            ids = ids[0]
            metadatas = results['metadatas'][0]
            documents = results['documents'][0]
        else:
            metadatas = results.get('metadatas', [])
            documents = results.get('documents', [])
        
        for i, id in enumerate(ids):
            meta = metadatas[i] if i < len(metadatas) else {}
            doc = documents[i] if i < len(documents) else ""
            
            events.append({
                "id": id,
                "date": meta.get('date', 'Unknown'),
                "label": f"{meta.get('speaker_name', 'Unknown')} ({meta.get('party', 'Unknown')})",
                "topic": meta.get('topic', 'General'),
                "sentiment": meta.get('sentiment_score', 0.0),
                "preview": doc[:150] + "..." if len(doc) > 150 else doc
            })
        
        # Sort by date
        events.sort(key=lambda x: x['date'] if x['date'] != 'Unknown' else '0000-00-00')
        return events

    def get_all_laws(self) -> List[Dict]:
        """Retrieves all laws from the collection."""
        results = self.laws_collection.get(limit=500)
        
        laws = []
        if results['ids']:
            for i, id in enumerate(results['ids']):
                meta = results['metadatas'][i]
                laws.append({
                    "id": id,
                    "title": f"{meta.get('law_name', 'Unknown')} - Section {meta.get('section', '')}",
                    "law_name": meta.get('law_name', 'Unknown Law'),
                    "section": meta.get('section', ''),
                    "section_title": meta.get('section_title', ''),
                    "text": results['documents'][i],
                    "date": meta.get('date_enacted', 'Unknown Date'),
                    "type": meta.get('law_type', 'act')
                })
        
        return laws

    def get_collection_stats(self) -> Dict:
        """Get statistics about the collections."""
        return {
            "legal_texts": {
                "count": self.laws_collection.count(),
                "name": "legal_texts"
            },
            "hansard_debates": {
                "count": self.debates_collection.count(),
                "name": "hansard_debates"
            }
        }
