import React, { useState, useEffect, useCallback } from 'react';
import { LawArticle, SearchResult } from '../types';
import { searchLaws } from '../services/apiService';
import { Search, ChevronRight, FileText, Sparkles, Loader2, X } from 'lucide-react';
import debounce from 'lodash.debounce';

interface LawLibraryProps {
  laws: LawArticle[];
  onSelectLaw: (law: LawArticle) => void;
  isLoading?: boolean;
}

export const LawLibrary: React.FC<LawLibraryProps> = ({ laws, onSelectLaw, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [useAISearch, setUseAISearch] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);

  // Debounced AI search
  const performAISearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 3) {
        setSearchResults(null);
        return;
      }

      setIsSearching(true);
      try {
        const response = await searchLaws(query, useAISearch, 30);
        setSearchResults(response.results);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [useAISearch]
  );

  // Trigger search when search term changes
  useEffect(() => {
    if (useAISearch && searchTerm.length >= 3) {
      performAISearch(searchTerm);
    } else {
      setSearchResults(null);
    }
  }, [searchTerm, useAISearch, performAISearch]);

  // Local filtering for non-AI search
  const filteredLaws = searchTerm.length > 0 && !useAISearch
    ? laws.filter(law => 
        law.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        law.section.includes(searchTerm) ||
        law.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        law.statuteName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : searchTerm.length === 0 ? laws : [];

  // Display laws based on search mode
  const displayLaws = searchResults 
    ? searchResults.map(result => {
        // Find matching law or create from search result
        const existingLaw = laws.find(l => l.id === result.id);
        if (existingLaw) return existingLaw;
        
        return {
          id: result.id,
          section: result.metadata.section,
          title: result.metadata.section_title || `${result.metadata.law_name} - Section ${result.metadata.section}`,
          content: result.document,
          dateEnacted: 'Unknown',
          statuteName: result.metadata.law_name,
          sectionTitle: result.metadata.section_title,
          lawType: result.metadata.law_type
        } as LawArticle;
      })
    : filteredLaws;

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults(null);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Textes de Loi
          </h2>
          <span className="text-xs text-slate-600">{laws.length} documents</span>
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text"
            placeholder={useAISearch ? "Recherche IA (ex: 'déportation réfugié')..." : "Rechercher par mot-clé..."}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-9 pr-20 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {/* Clear button */}
          {searchTerm && (
            <button 
              onClick={clearSearch}
              className="absolute right-14 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          {/* AI Toggle */}
          <button
            onClick={() => setUseAISearch(!useAISearch)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${
              useAISearch 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
            title={useAISearch ? "Recherche sémantique IA activée" : "Recherche par mot-clé"}
          >
            <Sparkles className="w-3 h-3" />
            IA
          </button>
        </div>

        {/* Search status */}
        {isSearching && (
          <div className="mt-2 flex items-center gap-2 text-xs text-indigo-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            Recherche IA en cours...
          </div>
        )}
        
        {searchResults && !isSearching && (
          <div className="mt-2 text-xs text-slate-500">
            {searchResults.length} résultats trouvés par IA
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-500" />
            <p>Chargement des lois...</p>
          </div>
        ) : displayLaws.length > 0 ? (
          displayLaws.map((law, index) => (
            <div 
              key={`${law.id}-${index}`}
              onClick={() => onSelectLaw(law)}
              className="group p-3 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <div className="mt-0.5 w-6 h-6 rounded bg-slate-800 flex items-center justify-center group-hover:bg-indigo-900/30 group-hover:text-indigo-400 transition-colors text-slate-500 shrink-0">
                    <FileText className="w-3 h-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        § {law.section}
                      </span>
                      <span className="text-[10px] text-slate-600 truncate">{law.statuteName}</span>
                    </div>
                    <h3 className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors line-clamp-1">
                      {law.sectionTitle || law.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {law.content.substring(0, 150)}...
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </div>
          ))
        ) : searchTerm.length > 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p>Aucun résultat pour "{searchTerm}"</p>
            {useAISearch && searchTerm.length < 3 && (
              <p className="text-xs mt-2 text-slate-600">Entrez au moins 3 caractères pour la recherche IA</p>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <FileText className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p>Commencez par rechercher une loi</p>
          </div>
        )}
      </div>
    </div>
  );
};
