
import React, { useState } from 'react';
import { Book } from '../types';

interface PreviewProps {
  book: Book;
}

const Preview: React.FC<PreviewProps> = ({ book }) => {
  const [currentPage, setCurrentPage] = useState(0);

  const allPages = book.chapters.flatMap((ch, idx) => [
    { type: 'toc', content: `Chapter ${idx + 1}: ${ch.title}` },
    { type: 'title', content: ch.title },
    ...ch.content.split('\n\n').filter(p => p.trim()).map(p => ({ type: 'para', content: p }))
  ]);

  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-full bg-slate-100">
      <div className="mb-8 text-center animate-slide">
        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Paperwhite Simulator</h3>
        <p className="text-sm text-slate-500 font-medium">Amazon KDP Layout Verification Engine</p>
      </div>

      <div className="relative group">
        {/* Device Frame */}
        <div className="w-[420px] h-[680px] bg-slate-900 rounded-[45px] p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-[3px] border-slate-800 flex flex-col items-center relative transition-transform duration-700 hover:scale-[1.01]">
          {/* Bezel Buttons Simulation */}
          <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-[4px] h-20 bg-slate-700 rounded-l-md"></div>
          
          <div className="w-full h-full bg-[#fcfcf9] rounded-[4px] shadow-inner flex flex-col overflow-hidden text-[#1a1a1a]">
            {/* Kindle Header */}
            <div className="h-10 flex items-center justify-between px-6 border-b border-slate-200 text-[10px] font-bold text-slate-400">
              <span className="truncate max-w-[150px]">{book.metadata.title}</span>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="10" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span>8:45 AM</span>
              </div>
            </div>

            {/* Reading Surface */}
            <div className="flex-1 p-10 overflow-y-auto kindle-font scroll-smooth selection:bg-amber-100">
              {allPages.length > 0 ? (
                allPages.map((item, i) => (
                  <div key={i} className="mb-6">
                    {item.type === 'toc' ? (
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest border-b border-slate-100 pb-2 mb-8">{item.content}</div>
                    ) : item.type === 'title' ? (
                      <h2 className="text-3xl font-bold text-center mt-12 mb-16 leading-tight underline decoration-slate-200 underline-offset-8 decoration-1">{item.content}</h2>
                    ) : (
                      <p className="text-lg leading-[1.7] text-justify hyphens-auto mb-4 indent-4">{item.content}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center gap-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/></svg>
                  <p className="italic font-medium">Manuscript is currently empty.</p>
                </div>
              )}
            </div>

            {/* Kindle Footer */}
            <div className="h-10 flex items-center justify-between px-8 border-t border-slate-100 bg-[#f9f9f7] text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <span>Loc 45 of 890</span>
              <span>15% read</span>
            </div>
          </div>
          
          {/* Logo Brand */}
          <div className="mt-4 text-[10px] font-black text-slate-700 tracking-[0.3em] uppercase">Paperwhite</div>
        </div>
      </div>
      
      {/* Control Tools */}
      <div className="mt-10 flex gap-4 animate-slide" style={{ animationDelay: '0.2s' }}>
        <button className="bg-white border-2 border-slate-200 px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 hover:border-indigo-200 transition-all flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
           Back
        </button>
        <button className="bg-slate-900 border-2 border-slate-900 px-10 py-3 rounded-2xl text-sm font-black uppercase tracking-widest text-white hover:bg-indigo-600 hover:border-indigo-600 transition-all shadow-xl">
           Next Segment
        </button>
      </div>
    </div>
  );
};

export default Preview;