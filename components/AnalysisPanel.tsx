import React from 'react';
import { AnalysisState, DebateQuote } from '../types';
import { Timeline } from './Timeline';
import { CitationCard } from './CitationCard';
import { Loader2, AlertCircle, Scale, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AnalysisPanelProps {
  state: AnalysisState;
}

const getControversyDisplay = (level: string) => {
  const levelLower = level?.toLowerCase() || 'medium';
  
  if (levelLower.includes('high') || levelLower.includes('élevé')) {
    return { text: 'Élevée', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' };
  }
  if (levelLower.includes('low') || levelLower.includes('faible')) {
    return { text: 'Faible', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' };
  }
  return { text: 'Moyenne', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' };
};

const getConsensusIcon = (color: string) => {
  switch(color) {
    case 'red': return <TrendingDown className="w-4 h-4 text-red-400" />;
    case 'green': return <TrendingUp className="w-4 h-4 text-green-400" />;
    default: return <Minus className="w-4 h-4 text-yellow-400" />;
  }
};

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ state }) => {
  const handleScrollToQuote = (id: string) => {
    const el = document.getElementById(`quote-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (state.isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 p-8">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <div className="text-center">
          <p className="font-medium text-slate-200">Analyse en cours...</p>
          <p className="text-sm mt-1">Interrogation du RAG et analyse par IA</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-red-400 p-8 text-center">
        <AlertCircle className="w-12 h-12 mb-4 opacity-80" />
        <p className="font-semibold">Échec de l'analyse</p>
        <p className="text-sm mt-2 text-slate-400">{state.error}</p>
      </div>
    );
  }

  if (!state.data) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
        <Scale className="w-16 h-16 mb-4 opacity-20" />
        <h3 className="text-lg font-serif text-slate-300 mb-2">Analyse de l'Intention</h3>
        <p className="text-sm max-w-xs">
          Sélectionnez un texte de loi et cliquez sur "Analyser" pour découvrir l'intention législative et les controverses historiques.
        </p>
      </div>
    );
  }

  const controversy = getControversyDisplay(state.data.controversy_level);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-900">
      {/* Header Result */}
      <div className="p-5 border-b border-slate-800 bg-slate-900 z-10 shadow-sm shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-serif font-medium text-slate-200">Analyse de l'Intention</h2>
          <div className={`flex items-center gap-2 ${controversy.bg} rounded-full px-3 py-1 border ${controversy.border}`}>
            {getConsensusIcon(state.data.consensus_color)}
            <span className="text-xs text-slate-400">Controverse:</span>
            <span className={`text-sm font-medium ${controversy.color}`}>{controversy.text}</span>
          </div>
        </div>
        
        <p className="text-slate-300 leading-relaxed text-sm">
          {state.data.synthesis}
        </p>

        {state.data.key_arguments && state.data.key_arguments.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Arguments Clés</h4>
            <div className="flex flex-wrap gap-2">
              {state.data.key_arguments.map((arg, idx) => (
                <span key={idx} className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-400">
                  {arg}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Timeline Section */}
      {state.relatedQuotes.length > 0 && (
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/50 shrink-0">
          <Timeline quotes={state.relatedQuotes} onSelectQuote={handleScrollToQuote} />
        </div>
      )}

      {/* Scrollable Quotes List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Extraits des Débats ({state.relatedQuotes.length})
        </h3>
        {state.relatedQuotes.length > 0 ? (
          state.relatedQuotes.map((quote) => (
            <CitationCard key={quote.id} quote={quote} />
          ))
        ) : (
          <p className="text-sm text-slate-500 text-center py-8">
            Aucun débat parlementaire trouvé pour ce texte.
          </p>
        )}
      </div>
    </div>
  );
};
