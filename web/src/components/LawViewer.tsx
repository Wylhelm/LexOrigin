import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, Calendar, Tag, Loader2 } from 'lucide-react';

interface LawMeta {
    section?: string;
    lawName?: string;
    type?: string;
    date?: string;
}

interface LawViewerProps {
    lawText: string;
    lawTitle: string;
    lawMeta?: LawMeta;
    onAnalyze: (selectedText: string) => void;
    isAnalyzing?: boolean;
}

const LawViewer: React.FC<LawViewerProps> = ({ lawText, lawTitle, lawMeta, onAnalyze, isAnalyzing }) => {
    const [selection, setSelection] = useState<string>('');
    const [showButton, setShowButton] = useState(false);
    const [buttonPos, setButtonPos] = useState({ x: 0, y: 0 });

    const handleSelection = (e: React.MouseEvent) => {
        const selected = window.getSelection()?.toString();
        if (selected && selected.trim().length > 10) {
            setSelection(selected);
            setShowButton(true);
            setButtonPos({ x: e.clientX, y: e.clientY - 10 });
        } else {
            if (!selected) {
                setShowButton(false);
            }
        }
    };

    return (
        <div className="h-full flex flex-col theme-bg-primary overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b theme-border theme-bg-primary shrink-0">
                <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0 flex-1">
                        {lawMeta?.lawName && (
                            <div className="flex items-center gap-2 theme-text-secondary text-xs mb-2">
                                <FileText className="w-3.5 h-3.5" />
                                <span className="truncate">{lawMeta.lawName}</span>
                            </div>
                        )}
                        <h2 className="text-xl font-serif font-bold theme-text-primary leading-tight">
                            {lawTitle}
                        </h2>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {lawMeta?.section && (
                                <span className="text-xs font-mono theme-bg-tertiary theme-text-secondary px-2 py-0.5 rounded border theme-border">
                                    § {lawMeta.section}
                                </span>
                            )}
                            {lawMeta?.type && (
                                <span className="flex items-center gap-1 text-xs theme-text-accent">
                                    <Tag className="w-3 h-3" />
                                    {lawMeta.type}
                                </span>
                            )}
                            {lawMeta?.date && lawMeta.date !== 'Unknown' && (
                                <span className="flex items-center gap-1 text-xs theme-text-secondary">
                                    <Calendar className="w-3 h-3" />
                                    {lawMeta.date}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => onAnalyze(lawText)}
                        disabled={isAnalyzing}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0 ${
                            isAnalyzing
                                ? 'theme-bg-tertiary theme-text-secondary cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:shadow-indigo-500/20'
                        }`}
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Search className="w-4 h-4" />
                                Analyze full text
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div 
                className="flex-1 overflow-y-auto p-6 relative" 
                onMouseUp={handleSelection}
            >
                <div className="prose prose-sm max-w-none font-serif leading-relaxed">
                    <p className="whitespace-pre-wrap theme-text-primary">{lawText}</p>
                </div>
                
                {/* Warning for short text - Theme-aware */}
                {lawText.length < 100 && (
                    <div 
                        className="mt-6 p-4 rounded-lg border-2"
                        style={{ 
                            backgroundColor: 'var(--color-warning-bg)',
                            borderColor: 'var(--color-warning-border)'
                        }}
                    >
                        <p 
                            className="text-sm font-semibold"
                            style={{ color: 'var(--color-warning)' }}
                        >
                            ⚠️ This text is very short. Analysis may be limited.
                        </p>
                    </div>
                )}
            </div>

            {/* Selection popup */}
            {showButton && !isAnalyzing && (
                <motion.button
                    initial={{ scale: 0.8, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    style={{
                        position: 'fixed',
                        left: buttonPos.x,
                        top: buttonPos.y - 50
                    }}
                    className="z-50 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-sm font-bold transform -translate-x-1/2 transition-colors border border-indigo-400"
                    onClick={(e) => {
                        e.stopPropagation();
                        onAnalyze(selection);
                        setShowButton(false);
                    }}
                >
                    <Search className="w-4 h-4" />
                    Analyze selection
                </motion.button>
            )}
        </div>
    );
};

export default LawViewer;
