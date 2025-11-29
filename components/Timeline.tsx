import React from 'react';
import { motion } from 'framer-motion';
import { DebateQuote } from '../types';

interface TimelineProps {
  quotes: DebateQuote[];
  onSelectQuote: (id: string) => void;
}

// Parse various date formats
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr || dateStr === 'Unknown') return null;
  
  // Try parsing different formats
  // Format: "Wednesday, June 21, 2023"
  const longFormat = dateStr.match(/(\w+),?\s+(\w+)\s+(\d+),?\s+(\d{4})/);
  if (longFormat) {
    const months: Record<string, number> = {
      'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
      'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
    };
    const month = months[longFormat[2]];
    if (month !== undefined) {
      return new Date(parseInt(longFormat[4]), month, parseInt(longFormat[3]));
    }
  }
  
  // Format: "2023-06-21" or "2024-03-15"
  const isoFormat = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoFormat) {
    return new Date(parseInt(isoFormat[1]), parseInt(isoFormat[2]) - 1, parseInt(isoFormat[3]));
  }
  
  // Try native parsing
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  return null;
};

const formatDate = (date: Date): string => {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

const getPartyColor = (party: string): string => {
  const partyLower = party.toLowerCase();
  if (partyLower.includes('liberal') || partyLower.includes('lib')) return 'border-red-500 bg-red-500/20';
  if (partyLower.includes('conservative') || partyLower.includes('cpc') || partyLower.includes('con')) return 'border-blue-500 bg-blue-500/20';
  if (partyLower.includes('ndp') || partyLower.includes('npd')) return 'border-orange-500 bg-orange-500/20';
  if (partyLower.includes('bloc') || partyLower.includes('bq')) return 'border-cyan-500 bg-cyan-500/20';
  if (partyLower.includes('green') || partyLower.includes('vert')) return 'border-green-500 bg-green-500/20';
  return 'border-gray-500 bg-gray-500/20';
};

export const Timeline: React.FC<TimelineProps> = ({ quotes, onSelectQuote }) => {
  // Parse and filter quotes with valid dates
  const quotesWithDates = quotes
    .map(quote => ({
      ...quote,
      parsedDate: parseDate(quote.date)
    }))
    .filter(q => q.parsedDate !== null)
    .sort((a, b) => a.parsedDate!.getTime() - b.parsedDate!.getTime());
  
  if (quotesWithDates.length === 0) return null;

  const startDate = quotesWithDates[0].parsedDate!.getTime();
  const endDate = quotesWithDates[quotesWithDates.length - 1].parsedDate!.getTime();
  const range = endDate - startDate || 1;

  return (
    <div className="w-full py-2">
      <div className="relative h-10 flex items-center">
        {/* Base Line */}
        <div className="absolute left-0 right-0 h-0.5 bg-slate-700 rounded-full" />

        {/* Nodes */}
        {quotesWithDates.map((quote, index) => {
          const time = quote.parsedDate!.getTime();
          // Ensure nodes don't overlap at edges
          const positionPercent = quotesWithDates.length === 1 
            ? 50 
            : 5 + ((time - startDate) / range) * 90;

          return (
            <motion.div
              key={quote.id}
              className="absolute w-3 h-3 -ml-1.5 cursor-pointer group z-10"
              style={{ left: `${positionPercent}%` }}
              whileHover={{ scale: 1.5 }}
              onClick={() => onSelectQuote(quote.id)}
            >
              <div className={`
                w-full h-full rounded-full border-2 transition-colors
                ${getPartyColor(quote.party)}
              `} />
              
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[180px] 
                            opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none 
                            bg-slate-800 text-xs text-white p-2 rounded shadow-xl border border-slate-700 z-50">
                <p className="font-semibold truncate">{quote.speakerName}</p>
                <p className="text-slate-400 text-[10px]">{quote.party}</p>
                <p className="text-slate-500 text-[10px] mt-1">{formatDate(quote.parsedDate!)}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Date labels */}
      <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1 px-1">
        <span>{formatDate(quotesWithDates[0].parsedDate!)}</span>
        {quotesWithDates.length > 1 && (
          <span>{formatDate(quotesWithDates[quotesWithDates.length - 1].parsedDate!)}</span>
        )}
      </div>
    </div>
  );
};
