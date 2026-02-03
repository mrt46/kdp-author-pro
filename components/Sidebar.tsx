
import React from 'react';
import { Book, ChapterStatus } from '../types';

interface SidebarProps {
  activeBook: Book;
  activeChapterIndex: number;
  setActiveChapterIndex: (i: number) => void;
  onAddChapter: () => void;
}

const StatusIndicator = ({ status }: { status: ChapterStatus }) => {
  switch (status) {
    case 'writing':
    case 'revising':
      return <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>;
    case 'auditing':
      return <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>;
    case 'completed':
      return <div className="w-2 h-2 rounded-full bg-emerald-500"></div>;
    case 'error':
      return <div className="w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>;
    default:
      return <div className="w-2 h-2 rounded-full bg-slate-600"></div>;
  }
};

const Sidebar: React.FC<SidebarProps> = ({ activeBook, activeChapterIndex, setActiveChapterIndex, onAddChapter }) => {
  return (
    <aside className="w-72 bg-[#0f172a] border-r border-white/5 flex flex-col h-full shrink-0 overflow-hidden no-print">
      <div className="p-8 border-b border-white/5">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Manuscript Chapters</h3>
        <button 
          onClick={onAddChapter}
          className="w-full py-4 rounded-2xl border border-dashed border-slate-700 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-400 transition-all flex items-center justify-center gap-3 bg-white/5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Add Chapter
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scroll">
        {activeBook.chapters.map((chapter, idx) => (
          <button
            key={chapter.id}
            onClick={() => setActiveChapterIndex(idx)}
            className={`w-full text-left p-5 rounded-[24px] border-2 transition-all group flex flex-col gap-2 relative ${
              activeChapterIndex === idx 
                ? 'bg-indigo-600 border-indigo-400 shadow-2xl shadow-indigo-600/30 scale-[1.02]' 
                : 'bg-white/5 border-transparent hover:bg-white/[0.08]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${
                activeChapterIndex === idx ? 'text-indigo-200' : 'text-slate-500'
              }`}>
                Chapter {idx + 1}
              </span>
              <StatusIndicator status={chapter.status} />
            </div>
            <p className={`text-xs font-black leading-tight line-clamp-2 ${
              activeChapterIndex === idx ? 'text-white' : 'text-slate-200'
            }`}>
              {chapter.title || 'Drafting Title...'}
            </p>
            
            {/* Red status dot indicated in screenshot - using for status error/unfinished */}
            {(chapter.status === 'error' || chapter.status === 'empty') && (
               <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
            )}
          </button>
        ))}
      </div>

      <div className="p-8 border-t border-white/5 bg-black/40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-indigo-400 border border-white/5">
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/></svg>
          </div>
          <div className="flex-1">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Global Progress</p>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
                style={{ width: `${activeBook.chapters.length > 0 ? (activeBook.chapters.filter(c => c.status === 'completed').length / activeBook.chapters.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;