export interface LawArticle {
  id: string;
  section: string;
  title: string;
  content: string;
  dateEnacted: string;
  statuteName: string;
  sectionTitle?: string;
  lawType?: string;
}

export interface DebateQuote {
  id: string;
  lawId?: string;
  speakerName: string;
  party: string;
  date: string;
  text: string;
  sentimentScore: number;
  topic: string;
}

export interface AnalysisResponse {
  synthesis: string;
  controversy_level: string;
  consensus_color: 'red' | 'yellow' | 'green' | 'gray';
  key_arguments: string[];
}

export interface AnalysisState {
  isLoading: boolean;
  data: AnalysisResponse | null;
  relatedQuotes: DebateQuote[];
  error: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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
