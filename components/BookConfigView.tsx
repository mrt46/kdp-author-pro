
import React, { useState } from 'react';

interface BookConfigViewProps {
  title: string;
  onStart: (tone: string, length: 'short' | 'standard' | 'long') => void;
  onBack: () => void;
}

const TONE_OPTIONS = [
  { id: 'professional', label: 'Professional & Scientific', desc: 'Serious, reliable, and data-driven narrative.', icon: '🎓' },
  { id: 'storytelling', label: 'Storytelling', desc: 'Immersive, fluid, and descriptive language.', icon: '📖' },
  { id: 'educational', label: 'Educational & Guide', desc: 'Step-by-step teaching, clear and understandable style.', icon: '💡' },
  { id: 'humorous', label: 'Humorous & Fun', desc: 'Engaging, playful, and friendly approach.', icon: '🎭' },
  { id: 'academic', label: 'Academic & Detailed', desc: 'In-depth analysis, technical and comprehensive.', icon: '🔬' }
];

const LENGTH_OPTIONS = [
  { id: 'short', label: 'Short Guide', desc: '6-8 Chapters (~5,000 words). Ideal for quick consumption.', icon: '⚡' },
  { id: 'standard', label: 'Standard Book', desc: '10-12 Chapters (~15,000 words). Amazon KDP classic.', icon: '📚' },
  { id: 'long', label: 'Detailed Work', desc: '15-20 Chapters (~30,000+ words). Comprehensive reference source.', icon: '🏛️' }
];

const BookConfigView: React.FC<BookConfigViewProps> = ({ title, onStart, onBack }) => {
  const [selectedTone, setSelectedTone] = useState(TONE_OPTIONS[0]);
  const [selectedLength, setSelectedLength] = useState(LENGTH_OPTIONS[1]);

  return (
    <div className="p-16 max-w-5xl mx-auto space-y-12 animate-slide">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Book <span className="text-indigo-600">Configuration</span></h2>
        <p className="text-xl text-slate-500 font-medium italic">Define the style and length for your project "{title}".</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <section className="space-y-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] pl-2">Writing Style (Tone)</h3>
          <div className="space-y-3">
            {TONE_OPTIONS.map((tone) => (
              <button
                key={tone.id}
                onClick={() => setSelectedTone(tone)}
                className={`w-full p-5 rounded-3xl border-2 text-left transition-all flex items-center gap-4 ${
                  selectedTone.id === tone.id 
                    ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100' 
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                <span className="text-3xl grayscale-0">{tone.icon}</span>
                <div className="flex-1">
                  <p className="font-black text-slate-900">{tone.label}</p>
                  <p className="text-xs text-slate-500 leading-tight mt-1">{tone.desc}</p>
                </div>
                {selectedTone.id === tone.id && (
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] pl-2">Book Length</h3>
          <div className="space-y-3">
            {LENGTH_OPTIONS.map((len) => (
              <button
                key={len.id}
                onClick={() => setSelectedLength(len as any)}
                className={`w-full p-5 rounded-3xl border-2 text-left transition-all flex items-center gap-4 ${
                  selectedLength.id === len.id 
                    ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100' 
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                <span className="text-3xl">{len.icon}</span>
                <div className="flex-1">
                  <p className="font-black text-slate-900">{len.label}</p>
                  <p className="text-xs text-slate-500 leading-tight mt-1">{len.desc}</p>
                </div>
                {selectedLength.id === len.id && (
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="pt-10">
            <button
              onClick={() => onStart(selectedTone.id, selectedLength.id as any)}
              disabled={!selectedTone || !selectedLength}
              className="w-full bg-indigo-600 text-white py-6 rounded-[35px] font-black text-xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Production (Autonomous)
            </button>
            <button 
              onClick={onBack}
              className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors mt-4"
            >
              Back to Market Analysis
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BookConfigView;