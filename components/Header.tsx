
import React from 'react';
import { AppState } from '../types';

interface HeaderProps {
  view: AppState;
  setView: (v: AppState) => void;
  bookTitle?: string;
  hasBook: boolean;
  onExport: () => void;
  onExportPDF: () => void;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  backgroundTasksCount?: number;
}

const Header: React.FC<HeaderProps> = ({ view, setView, bookTitle, hasBook, onExport, onExportPDF, saveStatus, backgroundTasksCount = 0 }) => {
  return (
    <header className="glass-dark border-b border-white/5 px-8 py-3 flex items-center justify-between sticky top-0 z-50 no-print">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setView('dashboard')}>
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
            K
          </div>
          <div>
            <h1 className="text-xs font-black text-white tracking-widest uppercase">KDP PRO STUDIO</h1>
            <div className="flex items-center gap-2">
              {bookTitle ? (
                <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest truncate max-w-[200px]">
                  {bookTitle}
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  AI Publishing Hub
                </span>
              )}
            </div>
          </div>
        </div>
        
        {backgroundTasksCount > 0 && (
          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">AI Agent Active</span>
          </div>
        )}
      </div>

      {hasBook && (
        <nav className="flex items-center gap-2 bg-black/30 p-1.5 rounded-2xl border border-white/5">
          {[
            { id: 'dashboard', label: 'Studio' },
            { id: 'editor', label: 'Writing' },
            { id: 'orchestrator', label: 'War Room' },
            { id: 'lore-bible', label: 'World' },
            { id: 'illustrations', label: 'Visuals' },
            { id: 'legal-audit', label: 'Legal' },
            { id: 'marketing', label: 'Launch' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setView(item.id as AppState)} 
              className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                view === item.id 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 scale-105' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}

      <div className="flex items-center gap-4">
        {hasBook && saveStatus && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-tighter transition-all ${
            saveStatus === 'saving' 
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'saving' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
            {saveStatus === 'saving' ? 'Syncing' : 'Synced'}
          </div>
        )}
        <button 
          onClick={onExportPDF} 
          className="bg-white/5 hover:bg-white/10 text-white px-5 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border border-white/10"
        >
          Export
        </button>
      </div>
    </header>
  );
};

export default Header;