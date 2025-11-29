import { useState, useEffect, useCallback, useRef } from 'react';
import LawViewer from './components/LawViewer';
import IntentPanel from './components/IntentPanel';
import InteractiveTimeline from './components/InteractiveTimeline';
import AccessibilityMenu from './components/AccessibilityMenu';
import { ThemeProvider } from './contexts/ThemeContext';
import { BookOpen, Scale, Search, Sparkles, X, Loader2, GripVertical } from 'lucide-react';

interface Law {
    id: string;
    title: string;
    text: string;
    date: string;
    law_name?: string;
    section?: string;
    section_title?: string;
    type?: string;
}

interface TimelineEvent {
    date: string;
    label: string;
    party?: string;
}

function App() {
    const [laws, setLaws] = useState<Law[]>([]);
    const [filteredLaws, setFilteredLaws] = useState<Law[]>([]);
    const [selectedLaw, setSelectedLaw] = useState<Law | null>(null);
    const [analysis, setAnalysis] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingLaws, setIsLoadingLaws] = useState(true);
    const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
    
    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [useAISearch, setUseAISearch] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    
    // Resizable panels
    const [leftPanelWidth, setLeftPanelWidth] = useState(55); // percentage
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Stats
    const [stats, setStats] = useState<{ laws: number; debates: number } | null>(null);

    // Fetch laws from backend
    useEffect(() => {
        const fetchLaws = async () => {
            setIsLoadingLaws(true);
            try {
                const [lawsResponse, statsResponse] = await Promise.all([
                    fetch('http://localhost:8001/api/laws?limit=500'),
                    fetch('http://localhost:8001/api/stats')
                ]);
                
                if (lawsResponse.ok) {
                    const data = await lawsResponse.json();
                    setLaws(data);
                    setFilteredLaws(data);
                    if (data.length > 0) {
                        setSelectedLaw(data[0]);
                    }
                }
                
                if (statsResponse.ok) {
                    const statsData = await statsResponse.json();
                    setStats({
                        laws: statsData.legal_texts.count,
                        debates: statsData.hansard_debates.count
                    });
                }
            } catch (error) {
                console.error("Failed to fetch laws:", error);
            } finally {
                setIsLoadingLaws(false);
            }
        };
        fetchLaws();
    }, []);

    // AI Search
    const handleSearch = useCallback(async (query: string) => {
        if (query.length < 2) {
            setFilteredLaws(laws);
            return;
        }

        if (useAISearch && query.length >= 3) {
            setIsSearching(true);
            try {
                const response = await fetch(
                    `http://localhost:8001/api/laws/search?q=${encodeURIComponent(query)}&n=50&ai=true`
                );
                if (response.ok) {
                    const data = await response.json();
                    // Convert search results to Law format
                    const searchLaws = data.results.map((r: any) => ({
                        id: r.id,
                        title: r.metadata.section_title || `${r.metadata.law_name} - Section ${r.metadata.section}`,
                        text: r.document,
                        date: 'Unknown',
                        law_name: r.metadata.law_name,
                        section: r.metadata.section,
                        section_title: r.metadata.section_title,
                        type: r.metadata.law_type
                    }));
                    setFilteredLaws(searchLaws);
                }
            } catch (error) {
                console.error("Search failed:", error);
                // Fallback to local search
                const filtered = laws.filter(law =>
                    law.title.toLowerCase().includes(query.toLowerCase()) ||
                    law.text.toLowerCase().includes(query.toLowerCase())
                );
                setFilteredLaws(filtered);
            } finally {
                setIsSearching(false);
            }
        } else {
            // Local search
            const filtered = laws.filter(law =>
                law.title.toLowerCase().includes(query.toLowerCase()) ||
                law.text.toLowerCase().includes(query.toLowerCase()) ||
                (law.law_name && law.law_name.toLowerCase().includes(query.toLowerCase()))
            );
            setFilteredLaws(filtered);
        }
    }, [laws, useAISearch]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch(searchQuery);
        }, useAISearch ? 500 : 200);
        
        return () => clearTimeout(timer);
    }, [searchQuery, handleSearch]);

    const handleAnalyze = async (text: string) => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:8001/api/analyze-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    law_text: text,
                    law_context: selectedLaw?.title || "Legal Context"
                }),
            });

            if (!response.ok) throw new Error('Analysis failed');

            const data = await response.json();
            setAnalysis(data);
            
            // Extract timeline events from citations
            if (data.citations && data.citations.length > 0) {
                const events = data.citations
                    .filter((c: any) => c.date && c.date !== 'Unknown')
                    .map((c: any) => ({
                        date: c.date,
                        label: c.speaker || 'Unknown',
                        party: c.party
                    }));
                setTimelineEvents(events);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Resize handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing || !containerRef.current) return;
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const sidebarWidth = 256; // w-64 = 256px
        const availableWidth = rect.width - sidebarWidth;
        const mouseX = e.clientX - rect.left - sidebarWidth;
        const newWidth = (mouseX / availableWidth) * 100;
        setLeftPanelWidth(Math.min(80, Math.max(30, newWidth)));
    }, [isResizing]);

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
    }, []);

    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    return (
        <div className="h-screen flex flex-col theme-bg-primary theme-text-primary overflow-hidden font-sans">
            {/* Header */}
            <header className="h-14 theme-bg-secondary border-b theme-border flex items-center justify-between px-6 shadow-sm z-20">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <Scale className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-lg font-bold tracking-tight theme-text-primary">
                        LexOrigin 
                        <span className="theme-text-secondary font-normal text-sm ml-2">Legislative Archaeology</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    {stats && (
                        <div className="text-xs theme-text-secondary">
                            {stats.laws.toLocaleString()} laws • {stats.debates.toLocaleString()} debates
                        </div>
                    )}
                    <AccessibilityMenu />
                </div>
            </header>

            {/* Main Split View */}
            <div ref={containerRef} className="flex-1 flex overflow-hidden">
                {/* Sidebar - Law Selector */}
                <div className="w-64 theme-bg-secondary border-r theme-border flex flex-col shrink-0">
                    <div className="p-3 border-b theme-border">
                        <h2 className="text-xs font-semibold theme-text-secondary uppercase tracking-wider flex items-center gap-2 mb-3">
                            <BookOpen className="w-4 h-4" />
                            Legal Texts
                        </h2>
                        
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 theme-text-secondary" />
                            <input
                                type="text"
                                placeholder={useAISearch ? "AI Search..." : "Search..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full theme-bg-primary border theme-border rounded-lg py-2 pl-8 pr-16 text-sm theme-text-primary placeholder:theme-text-secondary focus:border-indigo-500 focus:outline-none"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-10 top-1/2 -translate-y-1/2 theme-text-secondary hover:theme-text-primary"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={() => setUseAISearch(!useAISearch)}
                                className={`absolute right-1.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all flex items-center gap-0.5 ${
                                    useAISearch 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'theme-bg-tertiary theme-text-secondary hover:opacity-80'
                                }`}
                                title={useAISearch ? "AI Semantic Search" : "Keyword Search"}
                            >
                                <Sparkles className="w-3 h-3" />
                                AI
                            </button>
                        </div>
                        
                        {isSearching && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs theme-text-accent">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                AI searching...
                            </div>
                        )}
                        {searchQuery && !isSearching && (
                            <div className="mt-2 text-xs theme-text-secondary">
                                {filteredLaws.length} result(s)
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {isLoadingLaws ? (
                            <div className="flex flex-col items-center justify-center py-8 theme-text-secondary">
                                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                                <span className="text-xs">Loading...</span>
                            </div>
                        ) : filteredLaws.length > 0 ? (
                            filteredLaws.map(law => (
                                <button
                                    key={law.id}
                                    onClick={() => {
                                        setSelectedLaw(law);
                                        setAnalysis(null);
                                        setTimelineEvents([]);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-start gap-2
                                        ${selectedLaw?.id === law.id ? 'theme-bg-accent theme-text-accent' : 'theme-text-secondary hover:theme-bg-primary hover:theme-text-primary'}`}
                                >
                                    <Scale className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span className="line-clamp-2">{law.title}</span>
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-8 theme-text-secondary text-sm">
                                No results
                            </div>
                        )}
                    </div>
                </div>

                {/* Left Panel: Law Viewer */}
                <div 
                    className="border-r theme-border relative z-0 min-w-0 overflow-hidden"
                    style={{ width: `${leftPanelWidth}%` }}
                >
                    {selectedLaw ? (
                        <LawViewer
                            lawText={selectedLaw.text}
                            lawTitle={selectedLaw.title}
                            lawMeta={{
                                section: selectedLaw.section,
                                lawName: selectedLaw.law_name,
                                type: selectedLaw.type,
                                date: selectedLaw.date
                            }}
                            onAnalyze={handleAnalyze}
                            isAnalyzing={isLoading}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center theme-text-secondary">
                            {isLoadingLaws ? 'Loading laws...' : 'Select a law'}
                        </div>
                    )}
                </div>

                {/* Resize Handle */}
                <div 
                    className={`w-1.5 theme-bg-tertiary hover:bg-indigo-500 cursor-col-resize flex items-center justify-center transition-colors shrink-0 ${isResizing ? 'bg-indigo-500' : ''}`}
                    onMouseDown={handleMouseDown}
                >
                    <GripVertical className="w-3 h-3 theme-text-secondary" />
                </div>

                {/* Right Panel: Analysis & Timeline */}
                <div 
                    className="flex flex-col theme-bg-tertiary border-l theme-border shadow-xl z-10 min-w-[300px] overflow-hidden"
                    style={{ width: `${100 - leftPanelWidth}%` }}
                >
                    <div className="flex-1 overflow-hidden relative">
                        <IntentPanel analysis={analysis} isLoading={isLoading} />
                    </div>

                    {/* Timeline at bottom of right panel */}
                    {timelineEvents.length > 0 && (
                        <div className="h-28 theme-bg-primary border-t theme-border shrink-0">
                            <InteractiveTimeline 
                                events={timelineEvents} 
                                onEventClick={(date) => console.log('Clicked:', date)} 
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Wrap App with ThemeProvider
const AppWithTheme = () => (
    <ThemeProvider>
        <App />
    </ThemeProvider>
);

export default AppWithTheme;
