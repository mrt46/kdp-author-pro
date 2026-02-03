
import React from 'react';
import { Book } from '../types';

interface LegalCounselViewProps {
  book: Book;
  onRunAudit: () => void;
  isGenerating: boolean;
}

const LegalCounselView: React.FC<LegalCounselViewProps> = ({ book, onRunAudit, isGenerating }) => {
  const audits = book.legalAudits || [];
  const latestAudit = audits[0];

  const getRiskStyles = (level: string) => {
    switch (level) {
      case 'low': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 glow-emerald';
      case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20 glow-amber';
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20 glow-red';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="p-16 max-w-7xl mx-auto space-y-16 bg-[#0f172a] min-h-full animate-slide">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-5xl font-black text-white tracking-tighter mb-4">Legal <span className="text-indigo-500">Counsel</span></h2>
          <p className="text-xl text-slate-400 font-medium max-w-2xl">
            Autonomous protection agent. Analyzes your manuscript for trademark violations, copyright risks, and KDP policy compliance.
          </p>
        </div>
        <button 
          onClick={onRunAudit}
          disabled={isGenerating}
          className="bg-white text-slate-900 px-10 py-5 rounded-[30px] font-black text-sm uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all duration-500 shadow-2xl shadow-indigo-500/10 disabled:opacity-50 flex items-center gap-3"
        >
          {isGenerating && <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>}
          {isGenerating ? 'Analyzing Legal Framework...' : 'Run Legal Audit'}
        </button>
      </div>

      {latestAudit ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Risk Status */}
          <div className={`lg:col-span-4 p-12 rounded-[40px] border flex flex-col items-center justify-center text-center transition-all duration-700 ${getRiskStyles(latestAudit.riskLevel)}`}>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] mb-6 opacity-60">Compliance Status</span>
            <div className="relative">
              <div className={`absolute -inset-8 blur-3xl rounded-full opacity-20 ${
                latestAudit.riskLevel === 'low' ? 'bg-emerald-500' : 
                latestAudit.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-red-500'
              }`}></div>
              <h3 className="text-7xl font-black uppercase relative z-10">{latestAudit.riskLevel}</h3>
            </div>
            <p className="mt-10 text-lg font-bold leading-relaxed">
              {latestAudit.riskLevel === 'low' ? 'Architecture is KDP compliant. No critical risks detected.' : 
               latestAudit.riskLevel === 'medium' ? 'Moderate warnings found. Review findings before publishing.' : 
               'Critical violations detected. Immediate intervention required.'}
            </p>
          </div>

          {/* Findings Detail */}
          <div className="lg:col-span-8 glass rounded-[40px] p-12 flex flex-col">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              </div>
              <h4 className="text-xl font-black text-white tracking-tight">Agent Findings & Directives</h4>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[400px] pr-4 custom-scroll">
              <div className="text-slate-300 whitespace-pre-wrap text-lg leading-relaxed font-medium">
                {latestAudit.findings}
              </div>
            </div>
            <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <span>Audit ID: {latestAudit.id.slice(0, 8)}</span>
              <span>Timestamp: {new Date(latestAudit.timestamp).toLocaleString()}</span>
            </div>
          </div>
          
          {/* History Timeline */}
          <div className="lg:col-span-12 space-y-6">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] pl-4">Audit History</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {audits.map((audit) => (
                <div key={audit.id} className="glass hover:bg-white/5 p-6 rounded-3xl border border-white/5 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getRiskStyles(audit.riskLevel)}`}>
                      {audit.riskLevel}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">
                      {new Date(audit.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs line-clamp-2 italic font-medium">
                    {audit.findings}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[50px] text-center glass">
          <div className="w-24 h-24 bg-white/5 text-slate-500 rounded-full flex items-center justify-center mb-8 border border-white/5">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
          </div>
          <h3 className="text-3xl font-black text-white tracking-tighter">Manuscript Unverified</h3>
          <p className="text-slate-400 max-w-md mt-4 text-lg font-medium">
            Launch the Legal Counsel agent to perform a deep-scan for copyright, trademark, and Amazon KDP policy compliance.
          </p>
          <button 
            onClick={onRunAudit}
            disabled={isGenerating}
            className="mt-10 bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-5 rounded-full font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all"
          >
            Start Initial Verification
          </button>
        </div>
      )}
    </div>
  );
};

export default LegalCounselView;