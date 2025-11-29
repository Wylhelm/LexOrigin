import React from 'react';
import { LawArticle } from '../types';
import { BookOpen, Search, ArrowLeft, Calendar, FileText } from 'lucide-react';

interface LawViewerProps {
  law: LawArticle;
  onAnalyze: (law: LawArticle) => void;
  onBack?: () => void;
  isAnalyzing: boolean;
}

export const LawViewer: React.FC<LawViewerProps> = ({ law, onAnalyze, onBack, isAnalyzing }) => {
  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 shrink-0">
        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center gap-1 text-slate-400 hover:text-indigo-400 text-sm mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la liste</span>
          </button>
        )}
        
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs uppercase tracking-widest font-medium truncate">{law.statuteName}</span>
            </div>
            <h1 className="text-xl font-serif text-slate-100 leading-tight">
              {law.sectionTitle || law.title}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                <FileText className="w-3 h-3" />
                § {law.section}
              </span>
              {law.dateEnacted && law.dateEnacted !== 'Unknown' && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {law.dateEnacted}
                </span>
              )}
              {law.lawType && (
                <span className="capitalize bg-indigo-900/30 text-indigo-300 px-2 py-0.5 rounded">
                  {law.lawType}
                </span>
              )}
            </div>
          </div>
          
          <button
            onClick={() => onAnalyze(law)}
            disabled={isAnalyzing}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg shrink-0
              shadow-lg border transition-all duration-300
              ${isAnalyzing 
                ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/30 hover:shadow-indigo-500/20'}
            `}
          >
            {isAnalyzing ? (
              <span className="text-sm">Analyse...</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span className="text-sm font-medium">Analyser tout le texte</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="text-slate-300 leading-relaxed whitespace-pre-wrap font-serif">
              {law.content}
            </div>
          </div>
          
          {/* Show warning if content is very short */}
          {law.content.length < 100 && (
            <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
              <p className="text-sm text-yellow-300">
                ⚠️ Ce texte est très court. L'analyse pourrait être limitée. Considérez rechercher des sections connexes pour plus de contexte.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
