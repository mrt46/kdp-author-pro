
import React from 'react';
import { AgentLog } from '../types';

interface AgentLogsPanelProps {
  logs: AgentLog[];
  onReadMore: (details: string) => void;
}

const AgentLogsPanel: React.FC<AgentLogsPanelProps> = ({ logs, onReadMore }) => {
  return (
    <div className="w-80 border-l border-slate-200 bg-slate-50 flex flex-col h-full shrink-0 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          Otonom Ajanlar
        </h3>
        <div className="text-[10px] font-bold text-slate-400 uppercase">Canlı Yayın</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aktivite Logları</h4>
          {logs.map((log) => (
            <div key={log.id} className={`p-3 rounded-xl text-xs border transition-all duration-300 ${
              log.agent === 'System Monitor' ? 'bg-slate-900 text-slate-300 border-slate-700' :
              log.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' :
              log.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
              'bg-white border-slate-100 text-slate-600 shadow-sm'
            }`}>
              <div className="flex justify-between mb-1 opacity-70 font-bold uppercase text-[9px]">
                <span className="flex items-center gap-1">
                  <span className={`w-1 h-1 rounded-full ${
                    log.agent === 'System Monitor' ? 'bg-indigo-400 animate-pulse' :
                    log.agent === 'Illustrator' ? 'bg-purple-500' :
                    log.agent === 'Revision Specialist' ? 'bg-blue-500' :
                    log.agent === 'Proofreader' ? 'bg-green-500' :
                    log.agent === 'Legal Counsel' ? 'bg-red-500' :
                    'bg-slate-400'
                  }`}></span>
                  {log.agent}
                </span>
                <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="leading-normal mb-1">{log.message}</p>
              {log.details && (
                <button 
                  onClick={() => onReadMore(log.details!)}
                  className={`font-bold hover:underline block text-[10px] mt-2 ${
                    log.agent === 'System Monitor' ? 'text-indigo-300' : 'text-indigo-600'
                  }`}
                >
                  Detayları Gör →
                </button>
              )}
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-center text-slate-400 text-xs py-10 italic">Henüz aktivite kaydedilmedi.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentLogsPanel;