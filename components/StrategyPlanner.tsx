
import React, { useState, useEffect, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import { ProjectStrategy, Chapter, AgentLog } from '../types';

interface StrategyPlannerProps {
  onStrategySelected: (s: ProjectStrategy, title: string, language: string) => void;
  addLog: (agent: AgentLog['agent'], msg: string, details?: string, type?: AgentLog['type']) => void;
  logs: AgentLog[];
}

const LANGUAGES = [
  { code: 'tr', name: 'Turkish', icon: '🇹🇷' },
  { code: 'en', name: 'English', icon: '🇺🇸' },
  { code: 'de', name: 'German', icon: '🇩🇪' },
  { code: 'es', name: 'Spanish', icon: '🇪🇸' },
  { code: 'fr', name: 'French', icon: '🇫🇷' },
  { code: 'it', name: 'Italian', icon: '🇮🇹' }
];

const StrategyPlanner: React.FC<StrategyPlannerProps> = ({ onStrategySelected, addLog, logs }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('tr');
  const [strategy, setStrategy] = useState<ProjectStrategy | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const logScrollRef = useRef<HTMLDivElement>(null);

  const [editableBrief, setEditableBrief] = useState('');
  const [editableChapters, setEditableChapters] = useState<Partial<Chapter>[]>([]);
  const [manualTitle, setManualTitle] = useState('');

  useEffect(() => {
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleStartCustomProtocol = async () => {
    if (!manualTitle.trim()) return;

    setIsAnalyzing(true);
    addLog('Director', `Preparing autonomous mission order for custom title: "${manualTitle}"...`);
    try {
      const result = await geminiService.performMarketAnalysis(manualTitle, selectedLanguage);

      // Auto-load market gaps and backend keywords
      addLog('SEO Analyst', 'Pazar açıklarını ve SEO anahtar kelimelerini analiz ediyor...', undefined, 'info');
      try {
        const seoData = await geminiService.generateSEOKeywords(
          manualTitle,
          result.marketAnalysis || `Strategic roadmap for: ${manualTitle}`,
          selectedLanguage
        );
        result.competitorGaps = seoData.competitorGaps;
        result.backendKeywords = seoData.backendKeywords;
        addLog('SEO Analyst', `${seoData.competitorGaps.length} pazar açığı ve ${seoData.backendKeywords.length} backend anahtar kelime belirlendi`, undefined, 'success');
      } catch (seoError) {
        addLog('SEO Analyst', 'SEO analizi atlandı, daha sonra yapılabilir', undefined, 'warning');
      }

      setStrategy(result);
      setEditableBrief(result.marketAnalysis || `Strategic roadmap for: ${manualTitle}.`);
      setEditableChapters(result.suggestedChapters || []);
      addLog('SEO Analyst', 'Strategic blueprint and agent instruction set created.', undefined, 'success');
    } catch (error) {
      addLog('Director', 'Error occurred during blueprint analysis.', undefined, 'warning');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateChapterTitle = (idx: number, title: string) => {
    const newChapters = [...editableChapters];
    newChapters[idx] = { ...newChapters[idx], title };
    setEditableChapters(newChapters);
  };

  const handleLaunch = () => {
    if (!strategy) return;
    const finalStrategy: ProjectStrategy = {
      ...strategy,
      marketAnalysis: editableBrief,
      suggestedChapters: editableChapters
    };
    onStrategySelected(finalStrategy, manualTitle, selectedLanguage);
  };

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-12 animate-slide pb-32">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 px-6 py-2 rounded-full">
           <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
           <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Command Center v5.0</span>
        </div>
        <h2 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">
          Project <span className="text-indigo-600">Initialization</span>
        </h2>
        <p className="text-slate-500 font-medium">Define your target book and language to begin autonomous generation.</p>
      </div>

      <div className="bg-white p-10 rounded-[50px] shadow-2xl border border-slate-100 space-y-10">
        <div className="flex justify-center gap-4">
           <div className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200">
              Custom Protocol
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4 mb-2 block">Operation Region (Book Language)</label>
            <select 
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-indigo-500 outline-none bg-slate-50 text-lg font-black"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.icon} {lang.name.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" 
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="Target Book Title..."
                className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-indigo-500 outline-none bg-slate-50 text-lg font-bold"
              />
              <button 
                onClick={handleStartCustomProtocol}
                disabled={!manualTitle.trim() || isAnalyzing}
                className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl disabled:opacity-50 transition-all"
              >
                {isAnalyzing ? 'Initializing...' : 'START CUSTOM FLOW'}
              </button>
            </div>
          </div>
        </div>

        {isAnalyzing && (
          <div className="py-20 flex flex-col items-center justify-center space-y-6 animate-pulse">
            <div className="w-20 h-20 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-xl font-black text-slate-900 uppercase tracking-widest">Compiling Mission Brief...</p>
          </div>
        )}

        {strategy && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide">
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-slate-900 rounded-[50px] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5">
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl">🎯</div>
                      <div>
                        <h4 className="text-2xl font-black tracking-tighter">Mission: {manualTitle}</h4>
                        <p className="text-indigo-400 font-black uppercase tracking-[0.2em] text-[10px]">Strategic Framework Active</p>
                      </div>
                    </div>
                    <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/10 text-center">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">Price Target</p>
                      <p className="text-lg font-black text-indigo-400">${strategy.pricingStrategy?.suggestedPrice || '9.99'}</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="bg-white/5 p-8 rounded-[35px] border border-white/10 group">
                      <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Strategic Agent Instructions</h5>
                      <textarea 
                        value={editableBrief}
                        onChange={(e) => setEditableBrief(e.target.value)}
                        className="w-full bg-transparent text-lg font-medium leading-relaxed text-slate-200 outline-none min-h-[120px] resize-none focus:text-white"
                        placeholder="AI is writing the strategic plan..."
                      />
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-4">Chapter Blueprint</h5>
                      <div className="grid grid-cols-1 gap-3">
                        {editableChapters.map((ch, i) => (
                          <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-[25px] border border-white/5 group hover:bg-white/10">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-black text-sm shrink-0">{i+1}</div>
                            <input 
                              value={ch.title}
                              onChange={(e) => updateChapterTitle(i, e.target.value)}
                              className="flex-1 bg-transparent font-black text-base text-white outline-none group-hover:text-indigo-400"
                              placeholder="Awaiting chapter title..."
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-slate-100 p-8 rounded-[40px] grid grid-cols-2 gap-8">
                <div>
                   <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 pl-2">Market Gaps</h5>
                   <ul className="space-y-3">
                      {(strategy.competitorGaps && strategy.competitorGaps.length > 0 ? strategy.competitorGaps : ["Collecting data..."]).map((gap, i) => (
                        <li key={i} className="flex items-start gap-3">
                           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                           <span className="text-sm font-bold text-slate-700 leading-tight">{gap}</span>
                        </li>
                      ))}
                   </ul>
                </div>
                <div>
                   <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 pl-2">SEO Keywords</h5>
                   <div className="flex flex-wrap gap-2">
                      {(strategy.seoKeywords && strategy.seoKeywords.length > 0 ? strategy.seoKeywords : ["Researching..."]).map((kw, i) => (
                        <span key={i} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-tighter">#{kw}</span>
                      ))}
                   </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
               <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 pl-2">Mission Parameters</h5>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center py-2 border-b border-slate-200">
                        <span className="text-xs text-slate-500 font-bold">Niche Depth</span>
                        <span className="text-xs font-black text-indigo-600">Optimized</span>
                     </div>
                     <div className="flex justify-between items-center py-2 border-b border-slate-200">
                        <span className="text-xs text-slate-500 font-bold">Language Flow</span>
                        <span className="text-xs font-black text-indigo-600">{selectedLanguage.toUpperCase()}</span>
                     </div>
                  </div>
               </div>

               <button 
                 onClick={handleLaunch}
                 className="w-full bg-slate-900 text-white py-8 rounded-[40px] font-black text-xl hover:bg-indigo-600 transition-all shadow-2xl flex flex-col items-center"
               >
                 <span>APPROVE & LAUNCH</span>
                 <span className="text-[10px] opacity-40 uppercase tracking-widest mt-2">Initialize Autonomous Write</span>
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategyPlanner;