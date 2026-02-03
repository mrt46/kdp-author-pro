
import React, { useState, useRef, useEffect } from 'react';
import { Chapter, TelemetryMetrics, AgentLog } from '../types';
import { geminiService } from '../services/geminiService';

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

interface EditorProps {
  chapter: Chapter;
  onUpdate: (content: string) => void;
  onAIRite: () => void;
  onApplyRevision: (request: string) => void;
  isGenerating: boolean;
  onFullAudit: () => void;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  telemetry?: TelemetryMetrics;
  logs?: AgentLog[];
}

const TelemetryProgressBar: React.FC<{ label: string, value: number, color: string }> = ({ label, value, color }) => (
  <div className="flex-1 px-1">
    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
      <div 
        className={`h-full ${color} transition-all duration-1000 ease-out`} 
        style={{ width: `${value}%` }}
      ></div>
    </div>
  </div>
);

const Editor: React.FC<EditorProps> = ({ chapter, onUpdate, onAIRite, onApplyRevision, isGenerating, onFullAudit, saveStatus, telemetry, logs = [] }) => {
  const [showProofreading, setShowProofreading] = useState(true);
  const [zenMode, setZenMode] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [revisionRequest, setRevisionRequest] = useState('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isGenerating]);

  const handlePlayAudio = async () => {
    if (!chapter.content) return;
    setIsAudioLoading(true);
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const base64 = await geminiService.generateAudio(chapter.content);
      if (base64) {
        const audioBuffer = await decodeAudioData(decode(base64), audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.start();
      }
    } catch (e) {
      console.error('Audio failed:', e);
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleRevisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (revisionRequest.trim()) {
      onApplyRevision(revisionRequest);
      setRevisionRequest('');
    }
  };

  const isRefactoringProcess = chapter.status === 'revising' || (chapter.status === 'error' && chapter.auditNotes);

  return (
    <div className={`flex-1 flex flex-col h-full bg-[#0f172a] transition-all duration-700 ${zenMode ? 'p-0' : ''}`}>
      {!zenMode && (
        <div className="h-20 border-b border-white/5 px-10 flex items-center justify-between glass-dark sticky top-0 z-20">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <h2 className="text-xl font-black text-white tracking-tighter truncate max-w-[400px] uppercase">
                {chapter.title || 'Initializing Section...'}
              </h2>
              <div className="flex items-center gap-4 mt-1">
                <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest ${
                  chapter.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                  chapter.status === 'error' ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-500/20 text-amber-500'
                }`}>
                  {chapter.status}
                </span>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{chapter.wordCount} Words</span>
              </div>
            </div>
            <button 
              onClick={handlePlayAudio}
              disabled={isAudioLoading || !chapter.content}
              className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all disabled:opacity-50"
            >
              {isAudioLoading ? <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>}
              TTS
            </button>
            <button 
              onClick={() => setZenMode(true)}
              className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all"
            >
              Zen Mode
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <form onSubmit={handleRevisionSubmit} className="flex gap-2">
              <input 
                type="text" 
                value={revisionRequest}
                onChange={(e) => setRevisionRequest(e.target.value)}
                placeholder="Micro-revise manuscript..."
                className="bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-indigo-500 w-64 transition-all"
              />
              <button 
                type="submit"
                disabled={isGenerating || !revisionRequest.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
              >
                Refine
              </button>
            </form>
            <button 
              onClick={onAIRite}
              disabled={isGenerating}
              className="flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded-[24px] text-[11px] font-black uppercase tracking-widest transition-all duration-300 border border-white/10 disabled:opacity-50"
            >
              {isGenerating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Autopilot Write'}
            </button>
          </div>
        </div>
      )}

      {zenMode && (
        <button 
          onClick={() => setZenMode(false)}
          className="fixed top-8 right-8 z-50 bg-black/50 hover:bg-black/80 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md opacity-30 hover:opacity-100 transition-all border border-white/10"
        >
          Exit Zen Mode
        </button>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 overflow-y-auto p-16 lg:px-32 xl:px-48 custom-scroll bg-white transition-all duration-1000 ${zenMode ? 'bg-[#f8fafc]' : ''}`}>
          <div className="max-w-3xl mx-auto h-full">
            {chapter.status === 'error' && chapter.failureDiagnosis && (
              <div className="bg-rose-500/5 border border-rose-500/20 p-8 rounded-[40px] mb-12 animate-in zoom-in-95 duration-500">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-rose-500/30 font-bold text-xl">
                    !
                  </div>
                  <div>
                    <h4 className="text-rose-900 font-black text-xl tracking-tight">System Analyst Diagnostic</h4>
                    <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest">Stall detected in generation loop</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm">
                  <p className="text-rose-800 text-sm leading-relaxed font-medium">
                    {chapter.failureDiagnosis}
                  </p>
                </div>
                <div className="mt-6 flex gap-3">
                  <button 
                    onClick={onAIRite}
                    className="bg-rose-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20"
                  >
                    Re-Analyze & Re-Queue
                  </button>
                </div>
              </div>
            )}
            <textarea
              value={chapter.content}
              onChange={(e) => onUpdate(e.target.value)}
              placeholder="Start your masterpiece..."
              className={`w-full h-full resize-none border-none focus:ring-0 text-2xl leading-[2] text-slate-800 kindle-font outline-none bg-transparent min-h-[1000px] selection:bg-indigo-100 placeholder:opacity-20 transition-all ${zenMode ? 'text-slate-900 leading-[2.2]' : ''}`}
            />
          </div>
        </div>

        {!zenMode && showProofreading && (
          <div className="w-96 bg-[#1e293b] border-l border-white/5 flex flex-col shrink-0 animate-slide">
            <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Agent Intelligence</h3>
              <button onClick={() => setShowProofreading(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            {/* Top progress bars from screenshot */}
            <div className="px-6 py-4 flex items-center gap-1 border-b border-white/5">
               <TelemetryProgressBar label="Action" value={telemetry?.actionLevel || 0} color="bg-emerald-400" />
               <TelemetryProgressBar label="Quality" value={telemetry?.kdpCompliance || 0} color="bg-amber-400" />
               <TelemetryProgressBar label="Tone" value={telemetry?.loreConsistency || 0} color="bg-indigo-400" />
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scroll bg-[#0f172a]/50">
              {chapter.auditNotes && (
                 <div className="bg-indigo-600/10 p-6 rounded-[30px] border border-indigo-500/20 shadow-xl">
                   <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3">
                    {isRefactoringProcess ? 'Revision Briefing' : 'Auditor Directive'}
                   </p>
                   <p className="text-slate-200 text-xs leading-relaxed italic font-medium">"{chapter.auditNotes}"</p>
                 </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between pl-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Agent Briefing</p>
                  {isGenerating && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>}
                </div>
                <div 
                  ref={logContainerRef}
                  className="bg-black/30 rounded-[40px] p-6 h-[400px] overflow-y-auto border border-white/5 space-y-4 custom-scroll"
                >
                  {logs.length > 0 ? logs.slice(0, 50).map((log) => (
                    <div key={log.id} className="animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-3 mb-1">
                         <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                            log.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                            log.type === 'warning' ? 'bg-rose-500/20 text-rose-400' :
                            log.type === 'critical' ? 'bg-red-600 text-white shadow-lg shadow-red-500/50' :
                            'bg-indigo-500/20 text-indigo-400'
                         }`}>{log.agent}</span>
                         <span className="text-[7px] text-slate-600 font-bold">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className={`text-[11px] leading-tight font-medium pl-1 ${
                        log.type === 'critical' ? 'text-rose-200' : 'text-slate-400'
                      }`}>{log.message}</p>
                    </div>
                  )) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-10">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/></svg>
                      <p className="text-[9px] font-black uppercase tracking-widest">Monitoring Operational</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;