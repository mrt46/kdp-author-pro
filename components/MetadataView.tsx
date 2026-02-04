
import React, { useState } from 'react';
import { BookMetadata, Chapter, ModelAssignment, AIProfile } from '../types';

interface MetadataViewProps {
  metadata: BookMetadata;
  chapters: Chapter[];
  modelAssignment: ModelAssignment;
  onSave: (m: BookMetadata, ma: ModelAssignment) => void;
  onGenerateOutline: () => void;
  onClearOutline: () => void;
  isGenerating: boolean;
  onOptimizeSEO: () => void;
}

const LANGUAGES = [
  { code: 'tr', name: 'Türkçe' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' }
];

const PROFILES: { label: string; value: AIProfile; icon: string }[] = [
  { label: 'Reasoning', value: 'Reasoning', icon: '🧠' },
  { label: 'Creative', value: 'Creative', icon: '✨' },
  { label: 'Balanced', value: 'Balanced', icon: '⚖️' },
  { label: 'Turbo', value: 'Turbo', icon: '⚡' }
];

const MetadataView: React.FC<MetadataViewProps> = ({ metadata, chapters, modelAssignment, onSave, onGenerateOutline, onClearOutline, isGenerating, onOptimizeSEO }) => {
  const [form, setForm] = useState<BookMetadata>(metadata);
  const [assignment, setAssignment] = useState<ModelAssignment>(modelAssignment);

  return (
    <div className="p-10 max-w-6xl mx-auto space-y-10 pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Kitap Detayları & Ayarlar</h2>
          <p className="text-slate-500">KDP yayıncılık stratejinizi kontrol edin.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] shadow-xl border border-slate-200 p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Kitap Başlığı" className="px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none text-lg font-bold" />
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Kitap Dili</label>
                <select 
                  value={form.language} 
                  onChange={e => setForm({...form, language: e.target.value})}
                  className="px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none bg-white"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <textarea rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Kitap Açıklaması" className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none resize-none" />
            
            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Amazon 7-Backend Keywords</h3>
                <button 
                  onClick={onOptimizeSEO}
                  disabled={isGenerating}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isGenerating ? 'Optimize Ediliyor...' : 'Yapay Zeka ile Doldur'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(form.strategy?.backendKeywords || ["", "", "", "", "", "", ""]).map((kw, i) => (
                  <input
                    key={i}
                    type="text"
                    value={kw}
                    onChange={(e) => {
                      const updated = [...(form.strategy?.backendKeywords || ["", "", "", "", "", "", ""])];
                      updated[i] = e.target.value;
                      setForm({ ...form, strategy: { ...form.strategy!, backendKeywords: updated } });
                    }}
                    placeholder={`Kutu ${i+1}`}
                    className="bg-slate-50 px-4 py-2 rounded-xl text-xs border border-slate-100 text-slate-600 focus:border-indigo-400 outline-none"
                  />
                ))}
              </div>

              {form.strategy?.sources && form.strategy.sources.length > 0 && (
                <div className="mt-6 border-t border-slate-50 pt-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">SEO Araştırma Kaynakları</h4>
                  <div className="flex flex-wrap gap-2">
                    {form.strategy.sources.map((src, idx) => (
                      <a 
                        key={idx} 
                        href={src.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors"
                      >
                        {src.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6">Mizanpaj Ayarları</h3>
            <div className="space-y-4">
              <select className="w-full p-3 rounded-xl border border-slate-100 text-sm font-medium">
                <option>6" x 9" (Standard)</option>
                <option>5.5" x 8.5"</option>
                <option>8.5" x 11" (Large)</option>
              </select>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="bleed" className="w-4 h-4 text-indigo-600" />
                <label htmlFor="bleed" className="text-xs text-slate-500 font-bold uppercase">Bleed (Taşma Payı)</label>
              </div>
            </div>
          </div>

          <button onClick={() => onSave(form, assignment)} className="w-full bg-indigo-600 text-white py-5 rounded-[24px] font-black text-lg hover:bg-indigo-700 transition-all shadow-xl">
            Ayarları Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

export default MetadataView;