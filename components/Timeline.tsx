import React from 'react';
import { motion } from 'framer-motion';
import { DebateQuote } from '../types';

interface TimelineProps {
  quotes: DebateQuote[];
  onSelectQuote: (id: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ quotes, onSelectQuote }) => {
  // Sort quotes by date to layout linearly
  const sortedQuotes = [...quotes].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  if (sortedQuotes.length === 0) return null;

  const startDate = new Date(sortedQuotes[0].date).getTime();
  const endDate = new Date(sortedQuotes[sortedQuotes.length - 1].date).getTime();
  const range = endDate - startDate || 1; // Avoid division by zero

  return (
    <div className="w-full py-6 px-2">
      <div className="relative h-12 flex items-center">
        {/* Base Line */}
        <div className="absolute left-0 right-0 h-0.5 bg-slate-700 rounded-full" />

        {/* Nodes */}
        {sortedQuotes.map((quote) => {
          const time = new Date(quote.date).getTime();
          const positionPercent = ((time - startDate) / range) * 100;

          return (
            <motion.div
              key={quote.id}
              className="absolute w-4 h-4 -ml-2 cursor-pointer group z-10"
              style={{ left: `${positionPercent}%` }}
              whileHover={{ scale: 1.5 }}
              onClick={() => onSelectQuote(quote.id)}
            >
              <div className={`
                w-full h-full rounded-full border-2 bg-slate-900 transition-colors
                ${quote.party === 'Liberal' ? 'border-red-500' : 
                  quote.party === 'Conservative' ? 'border-blue-500' : 
                  quote.party === 'NDP' ? 'border-orange-500' : 'border-gray-500'}
              `} />
              
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[150px] 
                            opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none 
                            bg-slate-800 text-xs text-white p-2 rounded shadow-xl border border-slate-700 z-50">
                <p className="font-semibold">{quote.speakerName}</p>
                <p className="text-slate-400 text-[10px]">{quote.date}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
        <span>{sortedQuotes[0].date}</span>
        <span>{sortedQuotes[sortedQuotes.length - 1].date}</span>
      </div>
    </div>
  );
};
