import React, { useState } from 'react';
import { MOCK_LAWS, MOCK_DEBATES } from './constants';
import { LawArticle, AnalysisState } from './types';
import { LawViewer } from './components/LawViewer';
import { AnalysisPanel } from './components/AnalysisPanel';
import { analyzeLegislativeIntent } from './services/geminiService';
import { Scale, Database } from 'lucide-react';

const App: React.FC = () => {
  // Simple state for the MVP. In a real app, use Zustand.
  const [selectedLaw, setSelectedLaw] = useState<LawArticle>(MOCK_LAWS[0]);
  
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isLoading: false,
    data: null,
    relatedQuotes: [],
    error: null,
  });

  const handleLawSelect = (law: LawArticle) => {
    setSelectedLaw(law);
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
      // In a real app: await api.post('/analyze-intent', { lawId: law.id })
      const relatedDebates = MOCK_DEBATES.filter(d => d.lawId === law.id);
      
      if (relatedDebates.length === 0) {
        throw new Error("No historical debates found for this section.");
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
        
        {/* Simple Document Switcher */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <Database className="w-3 h-3" />
             Corpus: Criminal Code
          </span>
          <select 
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded px-3 py-1 outline-none focus:border-indigo-500"
            value={selectedLaw.id}
            onChange={(e) => {
              const law = MOCK_LAWS.find(l => l.id === e.target.value);
              if (law) handleLawSelect(law);
            }}
          >
            {MOCK_LAWS.map(law => (
              <option key={law.id} value={law.id}>Section {law.section}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Main Split View */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Law Text */}
        <div className="w-1/2 h-full border-r border-slate-800">
          <LawViewer 
            law={selectedLaw} 
            onAnalyze={handleAnalyze} 
            isAnalyzing={analysisState.isLoading} 
          />
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
