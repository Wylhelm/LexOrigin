import React, { useState } from 'react';
import CitationCard from './CitationCard';
import { AlertCircle, CheckCircle, HelpCircle, Search, ChevronDown, ChevronUp } from 'lucide-react';

interface AnalysisResult {
    summary: string;
    controversy_level: string;
    consensus_color: string;
    citations: any[];
    key_arguments: string[];
}

interface IntentPanelProps {
    analysis: AnalysisResult | null;
    isLoading: boolean;
}

const IntentPanel: React.FC<IntentPanelProps> = ({ analysis, isLoading }) => {
    const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center theme-bg-tertiary p-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="theme-text-secondary">Analyzing parliamentary debates...</p>
                </div>
            </div>
        );
    }

    if (!analysis) {
        return (
            <div className="h-full flex items-center justify-center theme-bg-tertiary p-6">
                <div className="text-center theme-text-secondary">
                    <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>Select a law to analyze the legislator's intent.</p>
                </div>
            </div>
        );
    }

    // Truncate summary for collapsed view
    const maxSummaryLength = 300;
    const isSummaryLong = analysis.summary.length > maxSummaryLength;
    const displaySummary = !isAnalysisExpanded && isSummaryLong 
        ? analysis.summary.substring(0, maxSummaryLength) + '...' 
        : analysis.summary;

    return (
        <div className="h-full flex flex-col theme-bg-tertiary overflow-hidden">
            {/* Analysis Section - Compact and scrollable */}
            <div className="shrink-0 max-h-[40%] overflow-y-auto border-b theme-border theme-bg-secondary">
                <div className="p-4">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-bold theme-text-primary">Intent Analysis</h3>
                        <div className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5 shrink-0
                            ${analysis.consensus_color === 'red' ? 'bg-red-100 text-red-800' :
                                analysis.consensus_color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'}`}>
                            {analysis.consensus_color === 'red' ? <AlertCircle className="w-3 h-3" /> :
                                analysis.consensus_color === 'yellow' ? <HelpCircle className="w-3 h-3" /> :
                                    <CheckCircle className="w-3 h-3" />}
                            {analysis.controversy_level}
                        </div>
                    </div>

                    {/* Summary */}
                    <p className="theme-text-primary text-sm leading-relaxed mb-2">
                        {displaySummary}
                    </p>
                    
                    {isSummaryLong && (
                        <button 
                            onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
                            className="flex items-center gap-1 text-xs theme-text-accent hover:opacity-80 mb-3"
                        >
                            {isAnalysisExpanded ? (
                                <>
                                    <ChevronUp className="w-3 h-3" />
                                    Show less
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-3 h-3" />
                                    Read more
                                </>
                            )}
                        </button>
                    )}

                    {/* Key Arguments - Compact */}
                    {analysis.key_arguments && analysis.key_arguments.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold theme-text-secondary uppercase tracking-wider mb-1.5">Key Arguments</h4>
                            <ul className="list-disc list-inside text-xs theme-text-secondary space-y-0.5">
                                {analysis.key_arguments.slice(0, isAnalysisExpanded ? undefined : 3).map((arg, i) => (
                                    <li key={i} className="line-clamp-2">{arg}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Debate Excerpts Section - Takes remaining space */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 theme-bg-primary">
                <h4 className="text-xs font-semibold theme-text-secondary uppercase tracking-wider mb-3 sticky top-0 theme-bg-primary py-1">
                    Debate Excerpts ({analysis.citations.length})
                </h4>
                <div className="space-y-3">
                    {analysis.citations.map((citation, index) => (
                        <CitationCard
                            key={index}
                            speakerName={citation.speaker}
                            party={citation.party}
                            quote={citation.text}
                            date={citation.date}
                            sentiment={citation.sentiment}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default IntentPanel;
