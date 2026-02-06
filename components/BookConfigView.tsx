
import React, { useState, useMemo } from 'react';

interface BookConfigViewProps {
  title: string;
  onStart: (tone: string, length: 'short' | 'standard' | 'long') => void;
  onBack: () => void;
}

interface RecommendationData {
  suggestedProfile: string;
  estimatedCost: string;
  estimatedTime: string;
  strengths: string[];
  warnings: string[];
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

  // Generate recommendations based on selected configuration
  const recommendations: RecommendationData = useMemo(() => {
    const toneId = selectedTone.id;
    const lengthId = selectedLength.id;

    // Cost estimates (based on word count and model pricing)
    const costMap = {
      short: { creative: '$2-4', reasoning: '$1-2', turbo: '$0.50-1' },
      standard: { creative: '$8-12', reasoning: '$4-6', turbo: '$1.50-2.50' },
      long: { creative: '$20-30', reasoning: '$10-15', turbo: '$3-5' }
    };

    // Time estimates (based on chapter count and processing speed)
    const timeMap = {
      short: '15-25 min',
      standard: '30-50 min',
      long: '60-90 min'
    };

    // Profile recommendations based on tone
    const profileMap: Record<string, string> = {
      professional: 'Reasoning (DeepSeek R1) - Technical accuracy and depth',
      storytelling: 'Creative (Claude 4.5) - Narrative flow and emotion',
      educational: 'Balanced (GPT-4o) - Clarity and structure',
      humorous: 'Creative (Claude 4.5) - Wit and engagement',
      academic: 'Reasoning (DeepSeek R1) - Research-grade analysis'
    };

    const suggestedProfile = profileMap[toneId] || 'Balanced';
    const profileType = toneId === 'storytelling' || toneId === 'humorous' ? 'creative' :
                        toneId === 'professional' || toneId === 'academic' ? 'reasoning' : 'turbo';

    const estimatedCost = costMap[lengthId][profileType];
    const estimatedTime = timeMap[lengthId];

    // Combination-specific strengths
    const strengths: string[] = [];
    const warnings: string[] = [];

    if (toneId === 'storytelling' && lengthId === 'short') {
      strengths.push('Quick-read fiction perfect for modern readers');
      strengths.push('Lower production cost allows testing market response');
      warnings.push('Limited space for deep character development');
    } else if (toneId === 'storytelling' && lengthId === 'long') {
      strengths.push('Rich narrative with full character arcs');
      strengths.push('Premium pricing potential ($4.99-9.99)');
      warnings.push('Requires stronger reader commitment');
    } else if (toneId === 'professional' && lengthId === 'long') {
      strengths.push('Comprehensive reference material');
      strengths.push('Higher perceived value and authority');
      warnings.push('Niche audience - verify market demand first');
    } else if (toneId === 'educational' && lengthId === 'short') {
      strengths.push('Actionable quick-start guides perform well');
      strengths.push('Easy to update and iterate');
    } else if (toneId === 'humorous' && lengthId === 'standard') {
      strengths.push('Engaging format for broad appeal');
      strengths.push('Social media shareability potential');
    } else if (toneId === 'academic' && lengthId === 'short') {
      warnings.push('Academic style may need longer format for depth');
      strengths.push('Could work as research summary or literature review');
    }

    // General length-based insights
    if (lengthId === 'short') {
      strengths.push('Fast production enables rapid iteration');
    } else if (lengthId === 'long') {
      strengths.push('Stand-alone comprehensive resource');
    }

    return {
      suggestedProfile,
      estimatedCost,
      estimatedTime,
      strengths: strengths.length ? strengths : ['Solid balanced configuration for KDP publishing'],
      warnings
    };
  }, [selectedTone, selectedLength]);

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
        </section>
      </div>

      {/* AI-Powered Recommendations */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-indigo-100 rounded-3xl p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-lg">
            🤖
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">AI Configuration Analysis</h3>
            <p className="text-xs text-slate-500">Optimized insights for your selection</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-indigo-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Suggested Profile</p>
            <p className="text-sm font-bold text-indigo-600">{recommendations.suggestedProfile}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-indigo-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Estimated Cost</p>
            <p className="text-sm font-bold text-green-600">{recommendations.estimatedCost}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-indigo-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Estimated Duration</p>
            <p className="text-sm font-bold text-blue-600">{recommendations.estimatedTime}</p>
          </div>
        </div>

        {recommendations.strengths.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wider">✓ Strengths</p>
            <ul className="space-y-1">
              {recommendations.strengths.map((strength, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-green-500 font-bold mt-0.5">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {recommendations.warnings.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">⚠ Considerations</p>
            <ul className="space-y-1">
              {recommendations.warnings.map((warning, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-amber-500 font-bold mt-0.5">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Action Buttons */}
      <div className="space-y-4">
        <button
          onClick={() => onStart(selectedTone.id, selectedLength.id as any)}
          disabled={!selectedTone || !selectedLength}
          className="w-full bg-indigo-600 text-white py-6 rounded-[35px] font-black text-xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Production (Autonomous)
        </button>
        <button
          onClick={onBack}
          className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
        >
          Back to Market Analysis
        </button>
      </div>
    </div>
  );
};

export default BookConfigView;