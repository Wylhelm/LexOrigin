/**
 * API Service for LexOrigin Backend
 * Connects to FastAPI backend with RAG capabilities
 */

const API_BASE_URL = 'http://localhost:8001/api';

// Types matching the backend
export interface LawFromAPI {
  id: string;
  title: string;
  law_name: string;
  section: string;
  section_title: string;
  text: string;
  date: string;
  type: string;
}

export interface DebateFromAPI {
  speaker: string;
  party: string;
  date: string;
  text: string;
  sentiment: number;
  topic?: string;
}

export interface AnalysisFromAPI {
  summary: string;
  controversy_level: string;
  consensus_color: string;
  citations: DebateFromAPI[];
  key_arguments: string[];
}

export interface SearchResult {
  id: string;
  document: string;
  metadata: {
    law_name: string;
    section: string;
    section_title?: string;
    law_type?: string;
  };
  relevance_score: number;
}

export interface DirectQueryResponse {
  answer: string;
  sources: Array<{ type: string; id?: string; speaker?: string; relevance?: number }>;
  confidence: number;
}

export interface CollectionStats {
  legal_texts: { count: number; name: string };
  hansard_debates: { count: number; name: string };
}

// API Functions
export async function fetchLaws(limit: number = 100): Promise<LawFromAPI[]> {
  const response = await fetch(`${API_BASE_URL}/laws?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch laws');
  return response.json();
}

export async function searchLaws(query: string, useAI: boolean = true, nResults: number = 20): Promise<{ results: SearchResult[]; count: number }> {
  const response = await fetch(`${API_BASE_URL}/laws/search?q=${encodeURIComponent(query)}&n=${nResults}&ai=${useAI}`);
  if (!response.ok) throw new Error('Failed to search laws');
  return response.json();
}

export async function analyzeIntent(lawText: string, lawContext?: string): Promise<AnalysisFromAPI> {
  const response = await fetch(`${API_BASE_URL}/analyze-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ law_text: lawText, law_context: lawContext })
  });
  if (!response.ok) throw new Error('Failed to analyze intent');
  return response.json();
}

export async function directQuery(question: string): Promise<DirectQueryResponse> {
  const response = await fetch(`${API_BASE_URL}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
  if (!response.ok) throw new Error('Failed to query');
  return response.json();
}

export async function searchDebates(
  query: string, 
  nResults: number = 10, 
  partyFilter?: string
): Promise<{ results: any[]; count: number }> {
  let url = `${API_BASE_URL}/debates/search?q=${encodeURIComponent(query)}&n=${nResults}`;
  if (partyFilter) url += `&party=${encodeURIComponent(partyFilter)}`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to search debates');
  return response.json();
}

export async function getTimeline(topic?: string): Promise<any[]> {
  let url = `${API_BASE_URL}/timeline`;
  if (topic) url += `?topic=${encodeURIComponent(topic)}`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch timeline');
  return response.json();
}

export async function getStats(): Promise<CollectionStats> {
  const response = await fetch(`${API_BASE_URL}/stats`);
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
}

