"""
Pydantic models for LexOrigin API.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class LawArticle(BaseModel):
    """A single law article/section."""
    id: str
    law_name: str
    section: str
    section_title: Optional[str] = ""
    text: str
    date_enacted: Optional[str] = "Unknown"
    law_type: Optional[str] = "act"


class DebateExcerpt(BaseModel):
    """A debate intervention excerpt."""
    speaker: str
    party: str
    date: str
    text: str
    sentiment: float = 0.0
    topic: Optional[str] = "General"


class AnalysisRequest(BaseModel):
    """Request for legislative intent analysis."""
    law_text: str = Field(..., description="The text of the law to analyze")
    law_context: Optional[str] = Field(None, description="Additional context about the law")


class AnalysisResponse(BaseModel):
    """Response from legislative intent analysis."""
    summary: str = Field(..., description="Analysis summary")
    controversy_level: str = Field(..., description="Low, Medium, or High")
    consensus_color: str = Field(..., description="green, yellow, or red")
    citations: List[Dict[str, Any]] = Field(default_factory=list, description="Debate citations")
    key_arguments: List[str] = Field(default_factory=list, description="Key arguments from debates")


class SearchRequest(BaseModel):
    """Request for law search."""
    query: str = Field(..., description="Search query")
    n_results: int = Field(10, description="Number of results to return")
    use_ai: bool = Field(True, description="Whether to use AI for query enhancement")


class SearchResult(BaseModel):
    """A single search result."""
    id: str
    document: str
    metadata: Dict[str, Any]
    relevance_score: float = 0.0


class DirectQueryRequest(BaseModel):
    """Request for direct AI query."""
    question: str = Field(..., description="Question about immigration law")


class DirectQueryResponse(BaseModel):
    """Response from direct AI query."""
    answer: str
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    confidence: float = 0.5


class DebateSearchRequest(BaseModel):
    """Request for debate search."""
    query: str = Field(..., description="Search query")
    n_results: int = Field(10, description="Number of results")
    party_filter: Optional[str] = Field(None, description="Filter by party")
    date_from: Optional[str] = Field(None, description="Start date (YYYY-MM-DD)")
    date_to: Optional[str] = Field(None, description="End date (YYYY-MM-DD)")


class TimelineRequest(BaseModel):
    """Request for timeline events."""
    law_id: Optional[str] = None
    topic: Optional[str] = None


class CollectionStats(BaseModel):
    """Statistics about a collection."""
    count: int
    name: str


class StatsResponse(BaseModel):
    """Response with collection statistics."""
    legal_texts: CollectionStats
    hansard_debates: CollectionStats
