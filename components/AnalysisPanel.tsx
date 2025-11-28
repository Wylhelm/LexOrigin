import React from 'react';
import { AnalysisState, DebateQuote } from '../types';
import { Timeline } from './Timeline';
import { CitationCard } from './CitationCard';
import { Loader2, AlertCircle, Scale } from 'lucide-react';

interface AnalysisPanelProps {
  state: AnalysisState;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ state }) => {
  const handleScrollToQuote = (id: string) => {
    const el = document.getElementById(`quote-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (state.isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <div className="text-center">
          <p className="font-medium text-slate-200">Analyzing Hansard Debates...</p>
          <p className="text-sm">Retrieving historical context from Vector Store</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-red-400 p-8 text-center">
        <AlertCircle className="w-12 h-12 mb-4 opacity-80" />
        <p className="font-semibold">Analysis Failed</p>
        <p className="text-sm mt-2 text-slate-400">{state.error}</p>
      </div>
    );
  }

  if (!state.data) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
        <Scale className="w-16 h-16 mb-4 opacity-20" />
        <h3 className="text-lg font-serif text-slate-300 mb-2">Ready to Analyze</h3>
        <p className="text-sm max-w-xs">
          Select a legal text on the left to uncover the legislative intent and historical controversies.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-900">
      {/* Header Result */}
      <div className="p-6 border-b border-slate-800 bg-slate-900 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-medium text-indigo-400">Legislative Intent</h2>
          <div className="flex items-center gap-2 bg-slate-800 rounded-full px-3 py-1 border border-slate-700">
            <span className="text-xs text-slate-400 uppercase tracking-wide">Controversy</span>
            <div className={`w-2 h-2 rounded-full ${
              state.data.controversy_score > 7 ? 'bg-red-500 animate-pulse' :
              state.data.controversy_score > 4 ? 'bg-yellow-500' : 'bg-green-500'
            }`} />
            <span className="text-sm font-bold text-white">{state.data.controversy_score}/10</span>
          </div>
        </div>
        
        <p className="text-slate-300 leading-relaxed text-sm">
          {state.data.synthesis}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {state.data.key_arguments.map((arg, idx) => (
            <span key={idx} className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-400">
              {arg}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline Section */}
      <div className="px-6 py-2 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <Timeline quotes={state.relatedQuotes} onSelectQuote={handleScrollToQuote} />
      </div>

      {/* Scrollable Quotes List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Evidence (Hansard Extracts)
        </h3>
        {state.relatedQuotes.map((quote) => (
          <CitationCard key={quote.id} quote={quote} />
        ))}
      </div>
    </div>
  );
};
