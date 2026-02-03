
import React, { useState } from 'react';
import { VideoTrailer } from '../types';

interface MarketingViewProps {
  trailers: VideoTrailer[];
  onGenerateTrailer: (prompt: string) => void;
  onSuggestPrompt: () => Promise<string>;
  isGenerating: boolean;
  onGenerateKit: () => void;
}

const MarketingView: React.FC<MarketingViewProps> = ({ trailers, onGenerateTrailer, onSuggestPrompt, isGenerating, onGenerateKit }) => {
  const [prompt, setPrompt] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleSuggest = async () => {
    setIsSuggesting(true);
    const suggestion = await onSuggestPrompt();
    setPrompt(suggestion);
    setIsSuggesting(false);
  };

  return (
    <div className="p-16 max-w-7xl mx-auto space-y-16 bg-[#0f172a] min-h-full">
      <div className="flex items-end justify-between animate-slide">
        <div>
          <h2 className="text-5xl font-black text-white tracking-tighter mb-4">Marketing <span className="text-indigo-500">Lab</span></h2>
          <p className="text-xl text-slate-400 font-medium">Generate cinematic trailers and social blitz kits for TikTok & Instagram.</p>
        </div>
        <button 
          onClick={onGenerateKit}
          disabled={isGenerating}
          className="bg-white text-slate-900 px-10 py-5 rounded-[30px] font-black text-sm uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all duration-500 shadow-2xl shadow-indigo-500/10 disabled:opacity-50"
        >
          {isGenerating ? 'Synthesizing...' : 'Build Launch Kit'}
        </button>
      </div>

      <div className="glass rounded-[40px] p-12 shadow-2xl animate-slide" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Trailer Generator (Veo 3.1)</h3>
           <button 
             onClick={handleSuggest}
             disabled={isGenerating || isSuggesting}
             className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 hover:text-indigo-300 transition-colors disabled:opacity-50"
           >
             {isSuggesting ? (
                <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
             ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
             )}
             AI Suggest Prompt
           </button>
        </div>
        <div className="flex flex-col gap-6">
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the cinematic atmosphere... e.g. 'A shadowy silhouette walking through a neon-drenched Tokyo street, high-speed rain, cinematic noir...'"
            className="w-full bg-white/5 border border-white/10 p-8 rounded-[30px] text-white text-lg font-medium outline-none focus:border-indigo-500 transition-all min-h-[160px] resize-none"
          />
          <div className="flex justify-end">
            <button 
              onClick={() => onGenerateTrailer(prompt)}
              disabled={isGenerating || !prompt}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-5 rounded-full font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center gap-4 disabled:opacity-50 shadow-xl shadow-indigo-600/20"
            >
              {isGenerating && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              {isGenerating ? 'Rendering Cinematic...' : 'Generate Trailer'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {trailers.map((trailer, idx) => (
          <div key={trailer.id} className="bg-black/40 rounded-[40px] overflow-hidden shadow-2xl border border-white/5 group animate-slide" style={{ animationDelay: `${0.2 + idx * 0.1}s` }}>
            <div className="aspect-[9/16] relative">
              <video src={trailer.videoUrl} controls className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-8 flex flex-col justify-end pointer-events-none">
                <p className="text-xs text-indigo-400 font-black uppercase tracking-widest mb-2">Cinematic v1.0</p>
                <p className="text-sm text-white italic line-clamp-3 leading-relaxed opacity-80 font-medium">"{trailer.prompt}"</p>
              </div>
            </div>
          </div>
        ))}
        {trailers.length === 0 && !isGenerating && (
          <div className="lg:col-span-3 py-32 flex flex-col items-center justify-center opacity-20 grayscale">
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-6"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
            <p className="font-black uppercase tracking-[0.4em] text-xs">Awaiting First Capture</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketingView;