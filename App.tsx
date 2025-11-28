import React, { useState } from 'react';
import { MOCK_LAWS, MOCK_DEBATES } from './constants';
import { LawArticle, AnalysisState } from './types';
import { LawViewer } from './components/LawViewer';
import { AnalysisPanel } from './components/AnalysisPanel';
import { LegalAssistant } from './components/LegalAssistant';
import { LawLibrary } from './components/LawLibrary';
import { analyzeLegislativeIntent } from './services/geminiService';
import { Scale, Database, MessageSquare, Library } from 'lucide-react';

type LeftPanelView = 'assistant' | 'library' | 'details';

const App: React.FC = () => {
  const [leftView, setLeftView] = useState<LeftPanelView>('library');
  const [selectedLaw, setSelectedLaw] = useState<LawArticle | null>(null);
  
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isLoading: false,
    data: null,
    relatedQuotes: [],
    error: null,
  });

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
      // 1. Simulate Vector DB Retrieval (Filtering local mock data)
      const relatedDebates = MOCK_DEBATES.filter(d => d.lawId === law.id);
      
      // Note: For the new laws (Theft/Fraud) we might not have debates in MOCK_DEBATES.
      // We'll handle this gracefully.
      if (relatedDebates.length === 0) {
        // Fallback or empty state for demo if no specific debates exist
        // For MVP, we can reuse some generic debates or show empty.
        // Let's create a generic message if empty.
        throw new Error("No historical Hansard records found for this section in the demo database.");
      }

      // 2. Call Gemini Service
      const result = await analyzeLegislativeIntent(law, relatedDebates);

      // 3. Update UI
      setAnalysisState({
        isLoading: false,
        data: result,
        relatedQuotes: relatedDebates,
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
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded ml-2 border border-slate-700">MVP</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <Database className="w-3 h-3" />
             Corpus: Criminal Code
          </span>
        </div>
      </header>

      {/* Main Split View */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Research & Exploration */}
        <div className="w-1/2 h-full border-r border-slate-800 flex flex-col">
          
          {/* View Content */}
          <div className="flex-1 overflow-hidden relative">
            {leftView === 'assistant' && (
              <LegalAssistant laws={MOCK_LAWS} onSelectLaw={handleLawSelect} />
            )}
            
            {leftView === 'library' && (
              <LawLibrary laws={MOCK_LAWS} onSelectLaw={handleLawSelect} />
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

          {/* Bottom Navigation for Left Panel (Only show if not in details view for cleaner look, or always show?) 
              Let's hide it in details view to focus on reading, or keep it to allow quick switching.
              Let's keep it but disable if in details view? No, let's just show it.
          */}
          {leftView !== 'details' && (
             <div className="h-12 border-t border-slate-800 flex bg-slate-900">
               <button 
                 onClick={() => setLeftView('library')}
                 className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${leftView === 'library' ? 'text-indigo-400 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'}`}
               >
                 <Library className="w-4 h-4" />
                 Library
               </button>
               <div className="w-px bg-slate-800" />
               <button 
                 onClick={() => setLeftView('assistant')}
                 className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${leftView === 'assistant' ? 'text-indigo-400 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300'}`}
               >
                 <MessageSquare className="w-4 h-4" />
                 Assistant
               </button>
             </div>
          )}
        </div>

        {/* Right Panel: Analysis & RAG Results */}
        <div className="w-1/2 h-full bg-slate-900">
          <AnalysisPanel state={analysisState} />
        </div>
      </main>
    </div>
  );
};

export default App;