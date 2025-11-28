import React from 'react';
import { LawArticle } from '../types';
import { BookOpen, Search } from 'lucide-react';

interface LawViewerProps {
  law: LawArticle;
  onAnalyze: (law: LawArticle) => void;
  isAnalyzing: boolean;
}

export const LawViewer: React.FC<LawViewerProps> = ({ law, onAnalyze, isAnalyzing }) => {
  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3 text-slate-500 mb-2">
          <BookOpen className="w-5 h-5" />
          <span className="text-xs uppercase tracking-widest font-semibold">{law.statuteName}</span>
        </div>
        <h1 className="text-2xl font-serif text-slate-100 leading-tight">
          {law.title} <span className="text-slate-500 font-sans text-lg ml-2">§ {law.section}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-2 font-mono">Enacted: {law.dateEnacted}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 relative group">
        <div className="prose prose-invert prose-lg max-w-none font-serif leading-loose text-slate-300">
          <p className="whitespace-pre-line">
            {law.content}
          </p>
        </div>

        {/* Floating Action Button (Simulated context action) */}
        <div className="absolute top-8 right-8">
            <button
                onClick={() => onAnalyze(law)}
                disabled={isAnalyzing}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-full 
                    shadow-xl border border-indigo-500/30
                    transition-all duration-300 transform
                    ${isAnalyzing 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-105 hover:shadow-indigo-500/20'}
                `}
            >
                {isAnalyzing ? (
                    <span>Processing...</span>
                ) : (
                    <>
                        <Search className="w-4 h-4" />
                        <span className="text-sm font-medium">Analyze Intent</span>
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};
