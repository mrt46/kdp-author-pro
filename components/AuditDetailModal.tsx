
import React from 'react';

interface AuditDetailModalProps {
  content: string;
  onClose: () => void;
}

const AuditDetailModal: React.FC<AuditDetailModalProps> = ({ content, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col scale-in-center animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
          <h3 className="text-xl font-black text-slate-900">Detaylı Denetim Raporu</h3>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-10 prose prose-slate max-w-none">
          <div className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-lg">
            {content}
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black hover:bg-slate-800 transition-all"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditDetailModal;