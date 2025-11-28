import React from 'react';
import { DebateQuote } from '../types';
import { Quote, MessageSquare } from 'lucide-react';

interface CitationCardProps {
  quote: DebateQuote;
  highlighted?: boolean;
}

const getPartyColor = (party: string) => {
  switch (party) {
    case 'Liberal': return 'border-red-600 text-red-400';
    case 'Conservative': return 'border-blue-600 text-blue-400';
    case 'NDP': return 'border-orange-500 text-orange-400';
    case 'Green': return 'border-green-500 text-green-400';
    default: return 'border-gray-500 text-gray-400';
  }
};

export const CitationCard: React.FC<CitationCardProps> = ({ quote, highlighted }) => {
  const partyColorClass = getPartyColor(quote.party);

  return (
    <div 
      id={`quote-${quote.id}`}
      className={`
        relative p-5 rounded-lg border bg-slate-850 transition-all duration-300
        ${highlighted ? 'border-indigo-500 shadow-lg shadow-indigo-900/20 scale-[1.02]' : 'border-slate-700 hover:border-slate-600'}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center bg-slate-900 ${partyColorClass}`}>
            <span className="font-bold text-xs">{quote.party.substring(0, 3).toUpperCase()}</span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">{quote.speakerName}</h4>
            <p className="text-xs text-slate-400">{quote.date} • {quote.topic}</p>
          </div>
        </div>
        {quote.sentimentScore < -0.5 && (
            <span className="px-2 py-0.5 rounded-full bg-red-900/50 text-red-200 text-xs border border-red-800">
                Critical
            </span>
        )}
      </div>

      <div className="relative">
        <Quote className="absolute -top-1 -left-1 w-4 h-4 text-slate-600 opacity-50" />
        <p className="text-slate-300 text-sm leading-relaxed pl-5 font-serif italic">
          "{quote.text}"
        </p>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <MessageSquare className="w-3 h-3 text-slate-500" />
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Hansard Record</span>
      </div>
    </div>
  );
};
