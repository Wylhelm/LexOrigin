import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LawArticle, AnalysisState, DebateQuote } from './types';
import { LawViewer } from './components/LawViewer';
import { AnalysisPanel } from './components/AnalysisPanel';
import { LegalAssistant } from './components/LegalAssistant';
import { LawLibrary } from './components/LawLibrary';
import { fetchLaws, analyzeIntent, getStats, LawFromAPI, AnalysisFromAPI } from './services/apiService';
import { Scale, Database, MessageSquare, Library, GripVertical } from 'lucide-react';

type LeftPanelView = 'assistant' | 'library' | 'details';

// Convert API law to frontend format
const convertLaw = (apiLaw: LawFromAPI): LawArticle => ({
  id: apiLaw.id,
  section: apiLaw.section,
  title: apiLaw.section_title || `${apiLaw.law_name} - Section ${apiLaw.section}`,
  content: apiLaw.text,
  dateEnacted: apiLaw.date || 'Unknown',
  statuteName: apiLaw.law_name,
  sectionTitle: apiLaw.section_title,
  lawType: apiLaw.type
});

// Convert API analysis response to frontend format
const convertAnalysis = (apiResponse: AnalysisFromAPI): { data: any; quotes: DebateQuote[] } => {
  const quotes: DebateQuote[] = (apiResponse.citations || []).map((cite, idx) => ({
    id: `quote-${idx}`,
    speakerName: cite.speaker || 'Unknown Speaker',
    party: cite.party || 'Unknown',
    date: cite.date || 'Unknown',
    text: cite.text || '',
    sentimentScore: cite.sentiment || 0,
    topic: cite.topic || 'General Debate'
  }));

  return {
    data: {
      synthesis: apiResponse.summary,
      controversy_level: apiResponse.controversy_level,
      consensus_color: apiResponse.consensus_color as any,
      key_arguments: apiResponse.key_arguments || []
    },
    quotes
  };
};

const App: React.FC = () => {
  const [leftView, setLeftView] = useState<LeftPanelView>('library');
  const [selectedLaw, setSelectedLaw] = useState<LawArticle | null>(null);
  const [laws, setLaws] = useState<LawArticle[]>([]);
  const [isLoadingLaws, setIsLoadingLaws] = useState(true);
  const [stats, setStats] = useState<{ laws: number; debates: number } | null>(null);
  
  // Resizable panel state
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isLoading: false,
    data: null,
    relatedQuotes: [],
    error: null,
  });

  // Fetch laws from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingLaws(true);
        const [apiLaws, apiStats] = await Promise.all([
          fetchLaws(500),
          getStats()
        ]);
        setLaws(apiLaws.map(convertLaw));
        setStats({
          laws: apiStats.legal_texts.count,
          debates: apiStats.hansard_debates.count
        });
      } catch (error) {
        console.error('Failed to load laws:', error);
      } finally {
        setIsLoadingLaws(false);
      }
    };
    loadData();
  }, []);

  // Handle resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    
    // Clamp between 20% and 80%
    setLeftPanelWidth(Math.min(80, Math.max(20, newWidth)));
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleLawSelect = (law: LawArticle) => {
    setSelectedLaw(law);
    setLeftView('details');
    // Reset analysis when changing law
    setAnalysisState({
      isLoading: false,
      data: null,
      relatedQuotes: [],
      error: null
    });
  };

  const handleAnalyze = async (law: LawArticle) => {
    setAnalysisState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Call the backend API
      const apiResponse = await analyzeIntent(
        `${law.title}: ${law.content}`,
        law.statuteName
      );

      const { data, quotes } = convertAnalysis(apiResponse);

      setAnalysisState({
        isLoading: false,
        data,
        relatedQuotes: quotes,
        error: null
      });

    } catch (err: any) {
      setAnalysisState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || "An unexpected error occurred."
      }));
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-200 overflow-hidden">
      {/* Top Navigation */}
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
            <Scale className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-serif font-bold tracking-tight text-slate-100">LexOrigin</span>
          <span className="text-xs text-slate-500 ml-2">Legislative Archaeology</span>
        </div>
        
        <div className="flex items-center gap-4">
          {stats && (
            <span className="text-xs text-slate-500 uppercase tracking-widest flex items-center gap-2">
               <Database className="w-3 h-3" />
               {stats.laws.toLocaleString()} Laws • {stats.debates.toLocaleString()} Debates
            </span>
          )}
        </div>
      </header>

      {/* Main Split View */}
      <main ref={containerRef} className="flex-1 flex overflow-hidden relative">
        {/* Left Panel: Research & Exploration */}
        <div 
          className="h-full border-r border-slate-800 flex flex-col"
          style={{ width: `${leftPanelWidth}%` }}
        >
          {/* View Content */}
          <div className="flex-1 overflow-hidden relative">
            {leftView === 'assistant' && (
              <LegalAssistant laws={laws} onSelectLaw={handleLawSelect} />
            )}
            
            {leftView === 'library' && (
              <LawLibrary 
                laws={laws} 
                onSelectLaw={handleLawSelect} 
                isLoading={isLoadingLaws}
              />
            )}

            {leftView === 'details' && selectedLaw && (
              <LawViewer 
                law={selectedLaw} 
                onAnalyze={handleAnalyze} 
                onBack={() => setLeftView('library')}
                isAnalyzing={analysisState.isLoading} 
              />
            )}
          </div>

          {/* Bottom Navigation for Left Panel */}
          {leftView !== 'details' && (
             <div className="h-12 border-t border-slate-800 flex bg-slate-900 shrink-0">
               <button 
                 onClick={() => setLeftView('library')}
                 className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${leftView === 'library' ? 'text-indigo-400 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'}`}
               >
                 <Library className="w-4 h-4" />
                 Textes de Loi
               </button>
               <div className="w-px bg-slate-800" />
               <button 
                 onClick={() => setLeftView('assistant')}
                 className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${leftView === 'assistant' ? 'text-indigo-400 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'}`}
               >
                 <MessageSquare className="w-4 h-4" />
                 Assistant IA
               </button>
             </div>
          )}
        </div>

        {/* Resize Handle */}
        <div 
          className={`w-1 bg-slate-800 hover:bg-indigo-500 cursor-col-resize flex items-center justify-center transition-colors group ${isResizing ? 'bg-indigo-500' : ''}`}
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="w-3 h-3 text-slate-600 group-hover:text-white" />
        </div>

        {/* Right Panel: Analysis & RAG Results */}
        <div 
          className="h-full bg-slate-900 overflow-hidden"
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          <AnalysisPanel state={analysisState} />
        </div>
      </main>
    </div>
  );
};

export default App;
