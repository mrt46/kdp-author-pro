
import React, { useState, useEffect } from 'react';
import { Book, Illustration } from '../types';

interface IllustratorPanelProps {
  book: Book;
  onGenerate: () => void;
  onEdit: (id: string, instruction: string) => void;
  isGenerating: boolean;
  pendingPrompt: {id: string; prompt: string} | null;
  onConfirm: (editedPrompt: string) => void;
  onCancel: () => void;
}

const IllustratorPanel: React.FC<IllustratorPanelProps> = ({
  book,
  onGenerate,
  onEdit,
  isGenerating,
  pendingPrompt,
  onConfirm,
  onCancel
}) => {
  const [editedPromptText, setEditedPromptText] = useState('');

  useEffect(() => {
    if (pendingPrompt) {
      setEditedPromptText(pendingPrompt.prompt);
    }
  }, [pendingPrompt]);

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-12 pb-32">
      <div className="flex items-center justify-between animate-slide">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Cover Design <span className="text-indigo-600">Hub</span></h2>
          <p className="text-slate-500 font-medium">Profesyonel Amazon KDP kapakları ve A+ Content tasarımları.</p>
        </div>
        <button 
          onClick={onGenerate}
          disabled={isGenerating}
          className="bg-slate-900 text-white px-10 py-4 rounded-[24px] font-black hover:bg-indigo-600 transition-all shadow-xl flex items-center gap-3"
        >
          {isGenerating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>}
          {isGenerating ? 'Tasarımcı Çalışıyor...' : 'Yeni Konseptler Üret'}
        </button>
      </div>

      {book.metadata.authorPersona && (
        <div className="bg-indigo-600 text-white p-10 rounded-[40px] shadow-2xl flex flex-col md:flex-row gap-10 items-center border border-white/10 animate-slide">
          <div className="w-32 h-32 rounded-[30px] bg-white/20 flex items-center justify-center text-4xl shrink-0 backdrop-blur-md">
            ✍️
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] bg-white/10 px-3 py-1 rounded-full">KDP Pen Name</span>
              <h3 className="text-3xl font-black">{book.metadata.authorPersona.penName}</h3>
            </div>
            <p className="text-indigo-100 text-lg font-medium leading-relaxed italic line-clamp-2">"{book.metadata.authorPersona.bio}"</p>
            <div className="flex gap-4">
              {book.metadata.authorPersona.expertise.map((exp, i) => (
                <span key={i} className="text-[9px] font-black uppercase bg-indigo-500/50 px-3 py-1.5 rounded-xl border border-white/10">{exp}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {book.illustrations.map((ill, idx) => (
          <div key={ill.id} className="bg-white rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-slate-100 group animate-slide" style={{ animationDelay: `${idx * 0.1}s` }}>
            <div className={`relative overflow-hidden bg-slate-50 ${ill.type === 'cover' ? 'aspect-[3/4]' : 'aspect-video'}`}>
              <img src={ill.url} alt={ill.prompt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute top-6 left-6">
                <span className="bg-slate-900/80 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                  {ill.type === 'cover' ? 'KDP Cover Concept' : 'A+ Content'}
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                 <p className="text-[10px] text-white/60 font-medium line-clamp-2 italic leading-relaxed mb-3">"{ill.prompt}"</p>
                 <button
                   onClick={() => onEdit(ill.id, ill.prompt)}
                   className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 transition-all"
                 >
                   Edit Prompt
                 </button>
              </div>
            </div>
          </div>
        ))}
        {book.illustrations.length === 0 && !isGenerating && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-[50px] text-slate-300">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
             </div>
             <p className="font-black uppercase tracking-[0.4em] text-xs">No Visual Assets Rendered</p>
          </div>
        )}
      </div>

      {/* Edit Prompt Modal */}
      {pendingPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-[40px] max-w-3xl w-full p-10 shadow-2xl border border-slate-200 animate-slide">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-slate-900">Edit Illustration Prompt</h3>
              <button
                onClick={onCancel}
                disabled={isGenerating}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Original Prompt</label>
                <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-200 italic">
                  "{pendingPrompt.prompt}"
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">New Prompt</label>
                <textarea
                  value={editedPromptText}
                  onChange={(e) => setEditedPromptText(e.target.value)}
                  disabled={isGenerating}
                  className="w-full h-40 px-6 py-4 border-2 border-slate-200 rounded-2xl resize-none focus:border-indigo-500 focus:outline-none transition-colors text-slate-900 font-medium"
                  placeholder="Enter your new prompt for the illustration..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => onConfirm(editedPromptText)}
                  disabled={isGenerating || !editedPromptText.trim()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Regenerating...
                    </>
                  ) : (
                    'Regenerate'
                  )}
                </button>
                <button
                  onClick={onCancel}
                  disabled={isGenerating}
                  className="px-8 py-4 border-2 border-slate-200 rounded-2xl font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IllustratorPanel;