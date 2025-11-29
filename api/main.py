"""
LexOrigin API - Canadian Immigration Law Analysis Platform

FastAPI backend with RAG capabilities using Ollama (gpt-oss:20b-cloud) and ChromaDB.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Optional, List
import os

from .models import (
    AnalysisRequest, AnalysisResponse,
    SearchRequest, SearchResult,
    DirectQueryRequest, DirectQueryResponse,
    DebateSearchRequest, TimelineRequest,
    StatsResponse
)
from .rag_engine import RAGEngine

# Global RAG Engine instance
rag_engine: Optional[RAGEngine] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - startup and shutdown."""
    global rag_engine
    
    print("=" * 60)
    print("Starting LexOrigin API")
    print("=" * 60)
    
    # Initialize RAG Engine
    print("\nInitializing RAG Engine...")
    rag_engine = RAGEngine()
    
    # Check existing data in collections
    laws_count = rag_engine.laws_collection.count()
    debates_count = rag_engine.debates_collection.count()
    
    print(f"\nExisting data: {laws_count} laws, {debates_count} debates")
    
    # Data directory
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    
    # Only ingest if collections are empty or force refresh is requested
    force_refresh = os.getenv("LEXORIGIN_FORCE_REFRESH", "false").lower() == "true"
    
    if laws_count == 0 or force_refresh:
        # Ingest immigration laws if available
        immigration_laws_file = os.path.join(data_dir, "immigration_laws.json")
        if os.path.exists(immigration_laws_file):
            print(f"\nIngesting immigration laws from {immigration_laws_file}...")
            count = rag_engine.ingest_laws(immigration_laws_file)
            print(f"  -> Ingested {count} law sections")
        else:
            print(f"\nWarning: Immigration laws file not found at {immigration_laws_file}")
            print("  Run: python -m api.scripts.fetch_immigration_laws")
    else:
        print(f"\nSkipping law ingestion - {laws_count} laws already in database")
    
    if debates_count == 0 or force_refresh:
        # Ingest Hansard debates if available
        debates_file = os.path.join(data_dir, "hansard_debates.json")
        if os.path.exists(debates_file):
            print(f"\nIngesting Hansard debates from {debates_file}...")
            count = rag_engine.ingest_debates(debates_file)
            print(f"  -> Ingested {count} debates")
        else:
            print(f"\nWarning: Hansard debates file not found at {debates_file}")
            print("  Run: python -m api.scripts.fetch_hansard")
    else:
        print(f"\nSkipping debate ingestion - {debates_count} debates already in database")
    
    # Print collection stats
    stats = rag_engine.get_collection_stats()
    print("\n" + "=" * 60)
    print("Collection Statistics:")
    print(f"  Legal Texts: {stats['legal_texts']['count']} documents")
    print(f"  Hansard Debates: {stats['hansard_debates']['count']} documents")
    print("=" * 60)
    print("\nLexOrigin API Ready!")
    
    yield
    
    # Shutdown
    print("\nShutting down LexOrigin API...")


app = FastAPI(
    title="LexOrigin API",
    description="Canadian Immigration Law Analysis Platform with RAG",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Health & Status Endpoints
# ============================================================================

@app.get("/")
async def root():
    """API health check."""
    return {
        "status": "running",
        "service": "LexOrigin API",
        "model": "gpt-oss:20b-cloud (Ollama)"
    }


@app.get("/api/stats", response_model=StatsResponse)
async def get_stats():
    """Get collection statistics."""
    if not rag_engine:
        raise HTTPException(status_code=503, detail="RAG Engine not initialized")
    return rag_engine.get_collection_stats()


# ============================================================================
# Law Search Endpoints
# ============================================================================

@app.get("/api/laws")
async def get_laws(
    limit: int = Query(100, description="Maximum number of laws to return")
):
    """Get all laws from the collection."""
    if not rag_engine:
        raise HTTPException(status_code=503, detail="RAG Engine not initialized")
    return rag_engine.get_all_laws()[:limit]


@app.post("/api/laws/search")
async def search_laws(request: SearchRequest):
    """Fuzzy search for laws with optional AI enhancement."""
    if not rag_engine:
        raise HTTPException(status_code=503, detail="RAG Engine not initialized")
    
    results = rag_engine.fuzzy_search_laws(
        query=request.query,
        n_results=request.n_results,
        use_ai=request.use_ai
    )
    return {"results": results, "count": len(results)}


@app.get("/api/laws/search")
async def search_laws_get(
    q: str = Query(..., description="Search query"),
    n: int = Query(10, description="Number of results"),
    ai: bool = Query(True, description="Use AI enhancement")
):
    """GET endpoint for law search (convenience)."""
    if not rag_engine:
        raise HTTPException(status_code=503, detail="RAG Engine not initialized")
    
    results = rag_engine.fuzzy_search_laws(query=q, n_results=n, use_ai=ai)
    return {"results": results, "count": len(results)}


# ============================================================================
# Direct AI Query Endpoint
# ============================================================================

@app.post("/api/query", response_model=DirectQueryResponse)
async def direct_query(request: DirectQueryRequest):
    """Directly query the AI about immigration law."""
    if not rag_engine:
        raise HTTPException(status_code=503, detail="RAG Engine not initialized")
    
    try:
        result = rag_engine.direct_ai_query(request.question)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/query")
async def direct_query_get(
    q: str = Query(..., description="Question about immigration law")
):
    """GET endpoint for direct AI query (convenience)."""
    if not rag_engine:
        raise HTTPException(status_code=503, detail="RAG Engine not initialized")
    
    try:
        result = rag_engine.direct_ai_query(q)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Legislative Intent Analysis
# ============================================================================

@app.post("/api/analyze-intent", response_model=AnalysisResponse)
async def analyze_intent(request: AnalysisRequest):
    """Analyze legislative intent for a given law text."""
    if not rag_engine:
        raise HTTPException(status_code=503, detail="RAG Engine not initialized")
    
    try:
        result = rag_engine.analyze_intent(request.law_text, request.law_context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Debate Search & Timeline
# ============================================================================

@app.post("/api/debates/search")
async def search_debates(request: DebateSearchRequest):
    """Search parliamentary debates with filters."""
    if not rag_engine:
        raise HTTPException(status_code=503, detail="RAG Engine not initialized")
    
    results = rag_engine.search_debates(
        query=request.query,
        n_results=request.n_results,
        party_filter=request.party_filter,
        date_from=request.date_from,
        date_to=request.date_to
    )
    return {"results": results, "count": len(results)}


@app.get("/api/debates/search")
async def search_debates_get(
    q: str = Query(..., description="Search query"),
    n: int = Query(10, description="Number of results"),
    party: Optional[str] = Query(None, description="Filter by party")
):
    """GET endpoint for debate search."""
    if not rag_engine:
        raise HTTPException(status_code=503, detail="RAG Engine not initialized")
    
    results = rag_engine.search_debates(query=q, n_results=n, party_filter=party)
    return {"results": results, "count": len(results)}


@app.get("/api/timeline/{law_id}")
async def get_timeline(law_id: str):
    """Get timeline events for a specific law."""
    if not rag_engine:
        raise HTTPException(status_code=503, detail="RAG Engine not initialized")
    
    events = rag_engine.get_timeline_events(law_id=law_id)
    return events


@app.get("/api/timeline")
async def get_all_timeline(
    topic: Optional[str] = Query(None, description="Filter by topic")
):
    """Get all timeline events, optionally filtered by topic."""
    if not rag_engine:
        raise HTTPException(status_code=503, detail="RAG Engine not initialized")
    
    events = rag_engine.get_timeline_events(topic=topic)
    return events


# ============================================================================
# Data Ingestion Endpoints (Admin)
# ============================================================================

@app.post("/api/admin/ingest/laws")
async def ingest_laws():
    """Trigger ingestion of immigration laws (admin endpoint)."""
    if not rag_engine:
        raise HTTPException(status_code=503, detail="RAG Engine not initialized")
    
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    laws_file = os.path.join(data_dir, "immigration_laws.json")
    
    if not os.path.exists(laws_file):
        raise HTTPException(
            status_code=404, 
            detail="Laws file not found. Run fetch_immigration_laws.py first."
        )
    
    count = rag_engine.ingest_laws(laws_file)
    return {"status": "success", "ingested": count}


@app.post("/api/admin/ingest/debates")
async def ingest_debates():
    """Trigger ingestion of Hansard debates (admin endpoint)."""
    if not rag_engine:
        raise HTTPException(status_code=503, detail="RAG Engine not initialized")
    
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    debates_file = os.path.join(data_dir, "hansard_debates.json")
    
    if not os.path.exists(debates_file):
        raise HTTPException(
            status_code=404,
            detail="Debates file not found. Run fetch_hansard.py first."
        )
    
    count = rag_engine.ingest_debates(debates_file)
    return {"status": "success", "ingested": count}
