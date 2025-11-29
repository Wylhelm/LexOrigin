import React from 'react';
import { motion } from 'framer-motion';

interface TimelineEvent {
    date: string;
    label: string;
    party?: string;
}

interface InteractiveTimelineProps {
    events: TimelineEvent[];
    onEventClick: (date: string) => void;
}

// Parse various date formats
const parseDate = (dateStr: string): Date | null => {
    if (!dateStr || dateStr === 'Unknown') return null;
    
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
    
    // Format: "2023-06-21"
    const isoFormat = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoFormat) {
        return new Date(parseInt(isoFormat[1]), parseInt(isoFormat[2]) - 1, parseInt(isoFormat[3]));
    }
    
    // Try native parsing
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (date: Date): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

const getPartyColor = (party?: string): string => {
    if (!party) return 'bg-slate-500';
    const p = party.toLowerCase();
    if (p.includes('liberal') || p.includes('lib')) return 'bg-red-500';
    if (p.includes('conservative') || p.includes('cpc') || p.includes('con')) return 'bg-blue-500';
    if (p.includes('ndp') || p.includes('npd')) return 'bg-orange-500';
    if (p.includes('bloc') || p.includes('bq')) return 'bg-cyan-500';
    if (p.includes('green') || p.includes('vert')) return 'bg-green-500';
    return 'bg-slate-500';
};

const InteractiveTimeline: React.FC<InteractiveTimelineProps> = ({ events, onEventClick }) => {
    // Parse dates and filter valid ones
    const eventsWithDates = events
        .map(e => ({ ...e, parsedDate: parseDate(e.date) }))
        .filter(e => e.parsedDate !== null)
        .sort((a, b) => a.parsedDate!.getTime() - b.parsedDate!.getTime());
    
    if (eventsWithDates.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center theme-text-secondary text-sm">
                No dated events
            </div>
        );
    }

    const startDate = eventsWithDates[0].parsedDate!.getTime();
    const endDate = eventsWithDates[eventsWithDates.length - 1].parsedDate!.getTime();
    const range = endDate - startDate || 1;

    return (
        <div className="w-full h-full py-4 px-6">
            <div className="relative h-full flex flex-col justify-center">
                {/* Horizontal Line */}
                <div className="absolute left-0 right-0 h-0.5 theme-bg-tertiary top-1/2 transform -translate-y-1/2 rounded-full" />

                {/* Points */}
                <div className="relative w-full h-8">
                    {eventsWithDates.map((event, index) => {
                        const time = event.parsedDate!.getTime();
                        const positionPercent = eventsWithDates.length === 1 
                            ? 50 
                            : 5 + ((time - startDate) / range) * 90;

                        return (
                            <motion.div
                                key={index}
                                whileHover={{ scale: 1.5 }}
                                whileTap={{ scale: 0.9 }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="absolute top-1/2 -translate-y-1/2 -ml-2 group cursor-pointer z-10"
                                style={{ left: `${positionPercent}%` }}
                                onClick={() => onEventClick(event.date)}
                            >
                                <div className={`w-4 h-4 ${getPartyColor(event.party)} rounded-full border-2 border-slate-900 shadow-lg group-hover:ring-2 group-hover:ring-white/30 transition-all`} />

                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity theme-bg-tertiary text-white text-xs py-2 px-3 rounded-lg whitespace-nowrap pointer-events-none shadow-xl z-50 border theme-border">
                                    <span className="font-semibold block theme-text-primary">{event.label}</span>
                                    {event.party && <span className="theme-text-secondary text-[10px]">{event.party}</span>}
                                    <span className="block theme-text-secondary text-[10px] mt-1">{formatDate(event.parsedDate!)}</span>
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Date Labels */}
                <div className="flex justify-between text-[10px] theme-text-secondary font-mono mt-4 px-2">
                    <span>{formatDate(eventsWithDates[0].parsedDate!)}</span>
                    {eventsWithDates.length > 1 && (
                        <span>{formatDate(eventsWithDates[eventsWithDates.length - 1].parsedDate!)}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InteractiveTimeline;
