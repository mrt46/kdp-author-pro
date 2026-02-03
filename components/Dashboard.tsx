
import React from 'react';
import { Book } from '../types';

interface DashboardProps {
  onNewBook: () => void;
  onImportBook: () => void;
  activeBook: Book | null;
  onContinue: () => void;
  onSelectResource: (topic: string) => void;
  isResourceLoading?: string | null;
}

const RESOURCES = [
  { id: "seo", label: "Amazon SEO Masterclass", icon: "📊" },
  { id: "format", label: "Formatting Standards", icon: "📏" },
  { id: "design", label: "Cover Design Psych", icon: "🎨" },
  { id: "ads", label: "KDP Ads Blueprint", icon: "🚀" }
];

const Dashboard: React.FC<DashboardProps> = ({ onNewBook, onImportBook, activeBook, onContinue, onSelectResource, isResourceLoading }) => {
  return (
    <div className="p-12 max-w-7xl mx-auto min-h-full flex flex-col bg-[#0f172a]">
      <div className="mb-16 animate-slide">
        <h2 className="text-6xl font-black text-white mb-4 tracking-tighter">
          Publish <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Legendary</span> Books.
        </h2>
        <p className="text-xl text-slate-400 font-medium">Your AI-powered publishing empire starts here.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Create New Card - Hero Section */}
        <div className="md:col-span-4 flex flex-col gap-4 h-[450px]">
          <button 
            onClick={onNewBook}
            className="flex-1 group relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[40px] p-10 text-white flex flex-col items-start justify-between transition-all duration-500 hover:scale-[1.02] shadow-2xl shadow-indigo-500/20"
          >
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-transform duration-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>
            </div>
            
            <div className="w-16 h-16 bg-white/20 rounded-[20px] flex items-center justify-center backdrop-blur-md group-hover:bg-white group-hover:text-indigo-600 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </div>
            
            <div>
              <h3 className="text-2xl font-black tracking-tight mb-2">Sıfırdan Yaz</h3>
              <p className="text-indigo-100 text-sm opacity-80">Yeni bir bestseller tasarla ve yaz.</p>
            </div>
          </button>

          <button 
            onClick={onImportBook}
            className="flex-1 group relative overflow-hidden bg-white/5 border border-white/10 rounded-[40px] p-10 text-white flex flex-col items-start justify-between transition-all duration-500 hover:scale-[1.02] shadow-2xl"
          >
            <div className="w-16 h-16 bg-white/10 rounded-[20px] flex items-center justify-center group-hover:bg-indigo-600 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            </div>
            
            <div>
              <h3 className="text-2xl font-black tracking-tight mb-2">Kitap İçe Aktar</h3>
              <p className="text-slate-400 text-sm opacity-80">Var olan kitabı revize et ve dönüştür.</p>
            </div>
          </button>
        </div>

        {/* Active Project Card */}
        <div className="md:col-span-5 glass rounded-[40px] p-10 flex flex-col h-[450px] animate-slide" style={{ animationDelay: '0.1s' }}>
          {activeBook ? (
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-6">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">In Production</span>
                </div>
                <h3 className="text-4xl font-black text-white mt-2 truncate leading-tight tracking-tighter">
                  {activeBook.metadata.title || 'Untitled Archive'}
                </h3>
                <p className="text-slate-400 text-lg mt-4 line-clamp-3 leading-relaxed">
                  {activeBook.metadata.description || 'No description provided yet for this manuscript.'}
                </p>
                
                <div className="mt-10 flex items-center gap-4">
                  <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl flex flex-col">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Manuscript</span>
                    <span className="text-xl font-bold text-white">{activeBook.chapters.reduce((a, b) => a + b.wordCount, 0)} <span className="text-sm font-medium text-slate-500">Words</span></span>
                  </div>
                  <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl flex flex-col">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Chapters</span>
                    <span className="text-xl font-bold text-white">{activeBook.chapters.length}</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={onContinue}
                className="w-full bg-white text-slate-900 py-6 rounded-3xl font-black text-lg hover:bg-indigo-500 hover:text-white transition-all duration-300 transform active:scale-95 shadow-xl shadow-white/5"
              >
                Resume Manuscript
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-500 mb-6"></div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs leading-loose">No active projects<br/>Awaiting initialization</p>
            </div>
          )}
        </div>

        {/* Resources Card */}
        <div className="md:col-span-3 glass rounded-[40px] p-8 flex flex-col h-[450px] animate-slide" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-8">Author Academy</h3>
          <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scroll">
            {RESOURCES.map((res) => (
              <button
                key={res.id}
                onClick={() => onSelectResource(res.label)}
                disabled={!!isResourceLoading}
                className="w-full group bg-white/5 hover:bg-white/10 border border-white/5 p-4 rounded-2xl flex items-center gap-4 transition-all disabled:opacity-50"
              >
                <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">{res.icon}</span>
                <span className="flex-1 text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{res.label}</span>
                {isResourceLoading === res.label ? (
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 text-indigo-500 transition-all"><path d="m9 18 6-6-6-6"/></svg>
                )}
              </button>
            ))}
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/5">
            <div className="bg-indigo-500/10 p-5 rounded-3xl flex items-center gap-4 border border-indigo-500/20">
              <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/></svg>
              </div>
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">AI Analyst</p>
                <p className="text-xs text-white font-bold">Research Assistant Online</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;