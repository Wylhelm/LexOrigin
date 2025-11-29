import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Quote, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';

interface CitationCardProps {
    speakerName: string;
    party: string;
    quote: string;
    date: string;
    sentiment: number;
}

const getPartyStyle = (party: string) => {
    const p = party?.toLowerCase() || '';
    if (p.includes('liberal') || p.includes('lib')) return { border: 'border-red-500', abbr: 'LIB', bg: 'bg-red-900/20' };
    if (p.includes('conservative') || p.includes('cpc') || p.includes('con')) return { border: 'border-blue-500', abbr: 'CPC', bg: 'bg-blue-900/20' };
    if (p.includes('ndp') || p.includes('npd')) return { border: 'border-orange-500', abbr: 'NDP', bg: 'bg-orange-900/20' };
    if (p.includes('bloc') || p.includes('québécois') || p.includes('bq')) return { border: 'border-cyan-500', abbr: 'BQ', bg: 'bg-cyan-900/20' };
    if (p.includes('green') || p.includes('vert')) return { border: 'border-green-500', abbr: 'GP', bg: 'bg-green-900/20' };
    return { border: 'border-slate-500', abbr: 'IND', bg: 'bg-slate-700' };
};

const CitationCard: React.FC<CitationCardProps> = ({
    speakerName,
    party,
    quote,
    date,
    sentiment,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isLongQuote = quote.length > 400;
    const displayQuote = isLongQuote && !isExpanded ? quote.substring(0, 400) + '...' : quote;
    
    const sentimentColor = sentiment > 0.2 ? 'bg-green-900/30 text-green-300 border-green-700' : 
                           sentiment < -0.2 ? 'bg-red-900/30 text-red-300 border-red-700' : 
                           'theme-bg-tertiary theme-text-secondary theme-border';
    const sentimentLabel = sentiment > 0.2 ? 'Favorable' : sentiment < -0.2 ? 'Critical' : 'Neutral';
    
    const partyStyle = getPartyStyle(party);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="theme-bg-tertiary rounded-lg p-4 mb-3 border theme-border hover:border-opacity-80 transition-all"
        >
            <div className="flex items-start mb-3 gap-3">
                <div className={cn("w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0", partyStyle.border, partyStyle.bg)}>
                    <span className="text-[10px] font-bold theme-text-secondary">{partyStyle.abbr}</span>
                </div>
                <div className="min-w-0 flex-1">
                    <h4 className="font-semibold theme-text-primary text-sm truncate">{speakerName || 'Unknown Speaker'}</h4>
                    <p className="text-xs theme-text-secondary">
                        <span>{party || 'Unknown'}</span>
                        {date && date !== 'Unknown' && <span> • {date}</span>}
                    </p>
                </div>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium border shrink-0", sentimentColor)}>
                    {sentimentLabel}
                </span>
            </div>

            <div className="relative pl-5">
                <Quote className="absolute top-0 left-0 w-4 h-4 theme-text-secondary opacity-50" />
                <p className="text-sm italic theme-text-primary leading-relaxed">
                    "{displayQuote}"
                </p>
                
                {isLongQuote && (
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="mt-2 flex items-center gap-1 text-xs theme-text-accent hover:opacity-80 transition-colors"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="w-3 h-3" />
                                Show less
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-3 h-3" />
                                Show more
                            </>
                        )}
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default CitationCard;
