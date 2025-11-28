export interface LawArticle {
  id: string;
  section: string;
  title: string;
  content: string;
  dateEnacted: string;
  statuteName: string;
}

export interface DebateQuote {
  id: string;
  lawId: string; // Foreign key for mock relationship
  speakerName: string;
  party: 'Liberal' | 'Conservative' | 'NDP' | 'Bloc' | 'Green' | 'Independent';
  date: string;
  text: string;
  sentimentScore: number; // -1.0 to 1.0
  topic: string;
}

export interface AnalysisResponse {
  synthesis: string;
  controversy_score: number; // 1-10
  key_arguments: string[];
  consensus_color: 'red' | 'yellow' | 'green';
}

export interface AnalysisState {
  isLoading: boolean;
  data: AnalysisResponse | null;
  relatedQuotes: DebateQuote[];
  error: string | null;
}
