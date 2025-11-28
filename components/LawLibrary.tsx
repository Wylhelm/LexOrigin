import React, { useState } from 'react';
import { LawArticle } from '../types';
import { Search, ChevronRight, FileText } from 'lucide-react';

interface LawLibraryProps {
  laws: LawArticle[];
  onSelectLaw: (law: LawArticle) => void;
}

export const LawLibrary: React.FC<LawLibraryProps> = ({ laws, onSelectLaw }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLaws = laws.filter(law => 
    law.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    law.section.includes(searchTerm) ||
    law.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-slate-950">
      <div className="p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <h2 className="text-lg font-serif font-medium text-slate-200 mb-4">Law Library</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text"
            placeholder="Search statutes, sections, or keywords..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredLaws.length > 0 ? (
          filteredLaws.map(law => (
            <div 
              key={law.id}
              onClick={() => onSelectLaw(law)}
              className="group p-4 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-8 h-8 rounded bg-slate-800 flex items-center justify-center group-hover:bg-indigo-900/30 group-hover:text-indigo-400 transition-colors text-slate-500">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        § {law.section}
                      </span>
                      <span className="text-xs text-slate-500 uppercase tracking-wide">Criminal Code</span>
                    </div>
                    <h3 className="font-serif text-slate-200 group-hover:text-white transition-colors">
                      {law.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {law.content}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p>No laws found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
};