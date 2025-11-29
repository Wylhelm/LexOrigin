import json
import os
import chromadb
from chromadb.config import Settings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
import uuid

def ingest_data():
    print("Starting ingestion...")
    
    # Load Seed Data
    with open("api/data/seed_data.json", "r") as f:
        data = json.load(f)
        
    legal_texts = data["legal_texts"]
    hansard_debates = data["hansard_debates"]
    
    # Initialize Embeddings
    embedding_function = HuggingFaceEmbeddings(
        model_name="all-MiniLM-L6-v2"
    )
    
    # Initialize Chroma Client
    persist_directory = "api/database"
    chroma_client = chromadb.PersistentClient(path=persist_directory)
    
    # Process Legal Texts
    print(f"Ingesting {len(legal_texts)} legal texts...")
    legal_docs = []
    for item in legal_texts:
        doc = Document(
            page_content=item["document"],
            metadata=item["metadata"]
        )
        doc.metadata["id"] = item["id"] # Store ID in metadata too
        legal_docs.append(doc)
        
    # We use a separate collection for laws if we want to search them, 
    # but the requirements say "Collection legal_texts".
    # LangChain's Chroma wrapper manages one collection at a time.
    
    Chroma.from_documents(
        documents=legal_docs,
        embedding=embedding_function,
        client=chroma_client,
        collection_name="legal_texts"
    )
    
    # Process Hansard Debates
    print(f"Ingesting {len(hansard_debates)} debates...")
    debate_docs = []
    for item in hansard_debates:
        doc = Document(
            page_content=item["document"],
            metadata=item["metadata"]
        )
        doc.metadata["id"] = item["id"]
        debate_docs.append(doc)
        
    Chroma.from_documents(
        documents=debate_docs,
        embedding=embedding_function,
        client=chroma_client,
        collection_name="hansard_debates"
    )
    
    print("Ingestion complete.")

if __name__ == "__main__":
    ingest_data()
