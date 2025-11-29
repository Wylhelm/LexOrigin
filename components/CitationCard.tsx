import React from 'react';
import { DebateQuote } from '../types';
import { Quote, MessageSquare, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CitationCardProps {
  quote: DebateQuote;
  highlighted?: boolean;
}

const getPartyStyle = (party: string) => {
  const partyLower = party?.toLowerCase() || '';
  
  if (partyLower.includes('liberal') || partyLower.includes('lib')) {
    return { border: 'border-red-600', text: 'text-red-400', bg: 'bg-red-900/30', abbr: 'LIB' };
  }
  if (partyLower.includes('conservative') || partyLower.includes('cpc') || partyLower.includes('con')) {
    return { border: 'border-blue-600', text: 'text-blue-400', bg: 'bg-blue-900/30', abbr: 'CPC' };
  }
  if (partyLower.includes('ndp') || partyLower.includes('npd')) {
    return { border: 'border-orange-500', text: 'text-orange-400', bg: 'bg-orange-900/30', abbr: 'NDP' };
  }
  if (partyLower.includes('bloc') || partyLower.includes('québécois') || partyLower.includes('bq')) {
    return { border: 'border-cyan-500', text: 'text-cyan-400', bg: 'bg-cyan-900/30', abbr: 'BQ' };
  }
  if (partyLower.includes('green') || partyLower.includes('vert')) {
    return { border: 'border-green-500', text: 'text-green-400', bg: 'bg-green-900/30', abbr: 'GP' };
  }
  return { border: 'border-gray-500', text: 'text-gray-400', bg: 'bg-gray-900/30', abbr: 'IND' };
};

const getSentimentIcon = (score: number) => {
  if (score > 0.2) return <TrendingUp className="w-3 h-3 text-green-400" />;
  if (score < -0.2) return <TrendingDown className="w-3 h-3 text-red-400" />;
  return <Minus className="w-3 h-3 text-slate-500" />;
};

export const CitationCard: React.FC<CitationCardProps> = ({ quote, highlighted }) => {
  const partyStyle = getPartyStyle(quote.party);
  
  // Truncate very long quotes
  const displayText = quote.text.length > 800 
    ? quote.text.substring(0, 800) + '...' 
    : quote.text;

  return (
    <div 
      id={`quote-${quote.id}`}
      className={`
        relative p-4 rounded-lg border bg-slate-850 transition-all duration-300
        ${highlighted ? 'border-indigo-500 shadow-lg shadow-indigo-900/20 scale-[1.02]' : 'border-slate-700 hover:border-slate-600'}
      `}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${partyStyle.border} ${partyStyle.bg} shrink-0`}>
            <span className={`font-bold text-[10px] ${partyStyle.text}`}>{partyStyle.abbr}</span>
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-slate-100 truncate">{quote.speakerName}</h4>
            <p className="text-xs text-slate-500">
              <span className={partyStyle.text}>{quote.party}</span>
              {quote.date && quote.date !== 'Unknown' && <span className="text-slate-600"> • {quote.date}</span>}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {getSentimentIcon(quote.sentimentScore)}
          {quote.sentimentScore < -0.3 && (
            <span className="px-2 py-0.5 rounded-full bg-red-900/50 text-red-200 text-[10px] border border-red-800">
              Critique
            </span>
          )}
          {quote.sentimentScore > 0.3 && (
            <span className="px-2 py-0.5 rounded-full bg-green-900/50 text-green-200 text-[10px] border border-green-800">
              Favorable
            </span>
          )}
        </div>
      </div>

      <div className="relative">
        <Quote className="absolute -top-1 -left-1 w-4 h-4 text-slate-600 opacity-50" />
        <p className="text-slate-300 text-sm leading-relaxed pl-5 font-serif italic">
          "{displayText}"
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {quote.topic && quote.topic !== 'General Debate' && (
          <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
            {quote.topic.length > 40 ? quote.topic.substring(0, 40) + '...' : quote.topic}
          </span>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <MessageSquare className="w-3 h-3 text-slate-600" />
          <span className="text-[10px] text-slate-600 uppercase tracking-wider">Hansard</span>
        </div>
      </div>
    </div>
  );
};
