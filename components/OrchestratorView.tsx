
import React, { useEffect, useRef } from 'react';
import { AgentLog, Book, TelemetryMetrics } from '../types';

interface OrchestratorViewProps {
  logs: AgentLog[];
  isGenerating: boolean;
  book: Book | null;
  onFinish: () => void;
  telemetry: TelemetryMetrics;
}

const Gauge: React.FC<{ label: string, value: number, color: string }> = ({ label, value, color }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="relative w-24 h-24">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * value) / 100} className={`${color} transition-all duration-1000 ease-out`} style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-black text-white">{value}%</span>
      </div>
    </div>
    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
  </div>
);

const AgentNode: React.FC<{ id: string, label: string, isActive: boolean, icon: string }> = ({ label, isActive, icon }) => (
  <div className={`relative flex flex-col items-center gap-3 transition-all duration-500 ${isActive ? 'scale-110 opacity-100' : 'opacity-40 scale-95'}`}>
    <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-3xl shadow-2xl transition-all duration-500 ${
      isActive ? 'bg-indigo-600 text-white glow-indigo' : 'bg-white/5 text-slate-500 border border-white/10'
    }`}>
      {icon}
    </div>
    <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>{label}</span>
    {isActive && (
       <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full animate-ping"></div>
    )}
  </div>
);

const OrchestratorView: React.FC<OrchestratorViewProps> = ({ logs, isGenerating, book, onFinish, telemetry }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-[#020617] text-white p-10 overflow-hidden font-sans">
      <div className="max-w-6xl mx-auto w-full flex flex-col h-full gap-8">
        <div className="flex items-center justify-between animate-slide">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full mb-4">
              <div className={`w-1.5 h-1.5 rounded-full ${isGenerating ? 'bg-indigo-400 animate-pulse' : 'bg-slate-500'}`}></div>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                {isGenerating ? 'VECTOR DB RETRIEVAL ACTIVE | DNA ANALYST v7' : 'SYSTEM STANDBY'}
              </span>
            </div>
            <h2 className="text-4xl font-black mb-2 tracking-tighter">Autonomous War Room</h2>
          </div>
          
          {!isGenerating && (
            <button 
              onClick={onFinish}
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 transition-all"
            >
              Return to Studio
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-hidden">
          <div className="lg:col-span-3 flex flex-col gap-8 glass rounded-[40px] p-8 border border-white/5">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest text-center border-b border-white/5 pb-4">Live Metrics</h3>
            <div className="grid grid-cols-2 gap-y-10">
              <Gauge label="Semantics" value={telemetry.actionLevel} color="text-indigo-500" />
              <Gauge label="Consistency" value={telemetry.loreConsistency} color="text-emerald-500" />
              <Gauge label="KDP Risk" value={telemetry.kdpCompliance} color="text-amber-500" />
              <Gauge label="Token Flow" value={88} color="text-purple-500" />
            </div>
            
            <div className="mt-auto space-y-4">
               <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Active Specialist</p>
                  <p className="text-xl font-black text-indigo-400">{isGenerating ? telemetry.activeAgent : 'Idle'}</p>
               </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col gap-6 overflow-hidden">
            <div className="glass rounded-[40px] p-8 border border-white/5 flex items-center justify-around relative overflow-hidden bg-gradient-to-b from-white/[0.02] to-transparent">
              <AgentNode id="retriever" label="Retriever" isActive={telemetry.activeAgent === 'Vector Retriever'} icon="🔎" />
              <AgentNode id="writer" label="Writer" isActive={telemetry.activeAgent === 'Writer'} icon="✍️" />
              <AgentNode id="auditor" label="Auditor" isActive={telemetry.activeAgent === 'Auditor'} icon="🧐" />
              <AgentNode id="architect" label="Architect" isActive={telemetry.activeAgent === 'World Architect'} icon="🏛️" />
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-4 bg-black/40 rounded-[40px] p-8 border border-white/5 shadow-2xl custom-scroll"
            >
              {logs.map((log) => (
                <div key={log.id} className="flex gap-4 animate-in slide-in-from-bottom-2 duration-300 group">
                  <div className="w-1 h-auto bg-white/5 group-hover:bg-indigo-500/30 transition-colors rounded-full shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black text-slate-500 opacity-50 uppercase">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                        log.agent === 'Vector Retriever' ? 'bg-indigo-600 text-white' :
                        log.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                        log.type === 'warning' ? 'bg-rose-500/10 text-rose-500' :
                        'bg-white/5 text-slate-400'
                      }`}>{log.agent}</span>
                    </div>
                    <p className={`text-sm leading-relaxed ${log.type === 'warning' ? 'text-rose-200 italic' : 'text-slate-200'}`}>{log.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 glass rounded-[40px] p-8 border border-white/5 flex flex-col gap-6">
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest text-center border-b border-white/5 pb-4">Knowledge Graph</h3>
             <div className="flex-1 overflow-y-auto space-y-4 custom-scroll pr-2">
                {book?.loreBible.map((entry) => (
                  <div key={entry.id} className={`p-4 rounded-2xl border transition-all duration-1000 ${entry.isNew ? 'bg-indigo-600/20 border-indigo-500 shadow-lg glow-indigo' : 'bg-white/5 border-white/5'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{entry.category}</span>
                      {entry.isNew && <span className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">ACTIVE</span>}
                    </div>
                    <p className="text-sm font-black text-white">{entry.name}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                       {entry.tags?.slice(0, 2).map(t => <span key={t} className="text-[7px] bg-white/5 px-1.5 py-0.5 rounded text-slate-400">#{t}</span>)}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrchestratorView;