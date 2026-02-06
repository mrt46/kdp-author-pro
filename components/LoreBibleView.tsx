
import React, { useState } from 'react';
import { LoreEntry } from '../types';

interface LoreBibleViewProps {
  lore: LoreEntry[];
  onRefresh: () => void;
  isGenerating: boolean;
}

const LoreBibleView: React.FC<LoreBibleViewProps> = ({ lore, onRefresh, isGenerating }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLore = lore.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 pb-32 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-slide">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Structured <span className="text-indigo-600">Memory</span></h2>
          <p className="text-slate-500 font-medium italic">Semantic Vector DB + Relational Knowledge Graph</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search Semantic Memory..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none w-64 md:w-80 bg-white shadow-sm font-bold text-sm"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          </div>
          <button 
            onClick={onRefresh}
            disabled={isGenerating}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-3 shadow-xl shadow-indigo-100"
          >
            {isGenerating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>}
            Sync DNA
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLore.map((entry, idx) => (
          <div key={entry.id} className={`bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group animate-slide ${entry.isNew ? 'ring-4 ring-indigo-500 ring-offset-4' : ''}`} style={{ animationDelay: `${idx * 0.05}s` }}>
            <div className="flex items-center justify-between mb-6">
              <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                entry.category === 'character' ? 'bg-indigo-100 text-indigo-700' :
                entry.category === 'location' ? 'bg-emerald-100 text-emerald-700' :
                entry.category === 'rule' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {entry.category}
              </span>
              <div className="flex gap-2">
                 <div className="w-2 h-2 rounded-full bg-indigo-200"></div>
                 <div className="w-2 h-2 rounded-full bg-indigo-300"></div>
                 <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              </div>
            </div>
            
            <h3 className="font-black text-2xl text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">{entry.name}</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed line-clamp-3 italic">"{entry.description}"</p>
            
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {entry.tags.map((tag, i) => (
                  <span key={i} className="bg-indigo-50 text-indigo-600 text-[9px] px-3 py-1.5 rounded-xl font-black uppercase tracking-tighter">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {entry.relationships && (
              <div className="pt-6 border-t border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                   Graph Relationship
                </p>
                <p className="text-xs text-indigo-900 font-bold leading-tight">{entry.relationships}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoreBibleView;