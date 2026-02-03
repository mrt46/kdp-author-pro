
import React, { useState, useEffect } from 'react';
import { geminiService, RefactorAnalysis } from '../services/geminiService';
import { BookMetadata, Chapter } from '../types';

interface RefactorerViewProps {
  onRefactorStart: (analysis: RefactorAnalysis, content: string, actionIds: string[], customInstruction: string, expansionFactor: number, selectedLanguage: string, chapterHandlingStrategy: 'detected' | 'resegment') => void;
  addLog: (agent: any, msg: string, details?: string, type?: any) => void;
}

const LANGUAGES = [
  { code: 'tr', name: 'Turkish', icon: '🇹🇷' },
  { code: 'en', name: 'English', icon: '🇺🇸' },
  { code: 'de', name: 'German', icon: '🇩🇪' },
  { code: 'es', name: 'Spanish', icon: '🇪🇸' },
  { code: 'fr', name: 'French', icon: '🇫🇷' },
  { code: 'it', name: 'Italian', icon: '🇮🇹' }
];

const RefactorerView: React.FC<RefactorerViewProps> = ({ onRefactorStart, addLog }) => {
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<RefactorAnalysis | null>(null);
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);
  const [customInstruction, setCustomInstruction] = useState('');
  const [expansionFactor, setExpansionFactor] = useState(1.5);
  const [selectedLanguage, setSelectedLanguage] = useState('tr');
  const [chapterHandlingStrategy, setChapterHandlingStrategy] = useState<'detected' | 'resegment'>('resegment');

  useEffect(() => {
    if (analysis && analysis.detectedChapters && analysis.detectedChapters.length > 0) {
      setChapterHandlingStrategy('detected'); // Eğer bölüm tespit edildiyse varsayılan olarak "koru" seçeneği
    } else if (analysis) {
      setChapterHandlingStrategy('resegment'); // Tespit edilmediyse "yeniden bölümle"
    }
  }, [analysis]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setContent(text);
      };
      reader.readAsText(file);
    }
  };

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    setIsAnalyzing(true);
    setAnalysis(null); // Yeni analiz için eski analizi temizle
    addLog('Revision Specialist', 'İçe aktarılan kitap içeriği otonom ajanlarca analiz ediliyor...', undefined, 'info');
    try {
      const result = await geminiService.analyzeImportedBook(content, selectedLanguage);
      setAnalysis(result);
      if (result.detectedChapters && result.detectedChapters.length > 0) {
        addLog('Revision Specialist', `${result.detectedChapters.length} adet bölüm tespit edildi.`, undefined, 'success');
      } else {
        addLog('Revision Specialist', 'Net bölüm yapıları tespit edilemedi, tahmini bölme kullanılacak.', undefined, 'warning');
      }
      addLog('Revision Specialist', 'Derin analiz tamamlandı. Kitap mimarisi revizyona hazır.', undefined, 'success');
    } catch (error) {
      addLog('Revision Specialist', 'Analiz sırasında kritik bir hata oluştu. Ajanlar metni çözümleyemedi.', String(error), 'warning');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleAction = (id: string) => {
    setSelectedActionIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const startProcess = () => {
    const selectedLabels = analysis!.suggestedActions
      .filter(a => selectedActionIds.includes(a.id))
      .map(a => a.label)
      .join(', ');
    
    const actionText = selectedActionIds.length > 0 
      ? `Seçilen Stratejiler: ${selectedLabels}. ` 
      : 'Genel Revizyon ve İyileştirme. ';

    const fullInstructions = `${actionText}Expansion Factor: ${expansionFactor}x word count. ${customInstruction}`;
    
    onRefactorStart(analysis!, content, selectedActionIds, fullInstructions, expansionFactor, selectedLanguage, chapterHandlingStrategy);
  };

  return (
    <div className="p-16 max-w-6xl mx-auto space-y-12 animate-slide">
      <div className="text-center space-y-4">
        <h2 className="text-6xl font-black text-slate-900 tracking-tighter">
          Master <span className="text-indigo-600">Refactor</span>
        </h2>
        <p className="text-xl text-slate-500 font-medium">Var olan eserinizi otonom ajanlarla yeniden tasarlayın ve sayfa sayısını artırın.</p>
      </div>

      <div className="bg-white p-12 rounded-[50px] shadow-2xl border border-slate-100 space-y-10">
        {!analysis ? (
          <div className="space-y-8">
            <div className="border-4 border-dashed border-slate-100 rounded-[40px] p-12 flex flex-col items-center justify-center text-center group hover:border-indigo-100 transition-all">
              <input 
                type="file" 
                id="file-upload" 
                className="hidden" 
                accept=".txt,.md" 
                onChange={handleFileUpload}
              />
              <label 
                htmlFor="file-upload" 
                className="cursor-pointer flex flex-col items-center gap-6"
              >
                <div className="w-24 h-24 bg-slate-50 rounded-[30px] flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">Kaynak Dosyayı Yükleyin</p>
                  <p className="text-slate-400 mt-2">Veya metni aşağıya yapıştırarak analizi başlatın.</p>
                </div>
              </label>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                 <div className="flex-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Kitap Ham Metni</label>
                    <textarea 
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full h-64 p-8 rounded-[30px] bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 outline-none text-slate-800 font-medium leading-relaxed resize-none"
                      placeholder="Revize edilecek metni buraya yapıştırın..."
                    />
                 </div>
                 <div className="w-48 shrink-0">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Kitap Dili</label>
                    <select 
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-indigo-500 outline-none bg-slate-50 text-lg font-black mt-2"
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.icon} {lang.name.toUpperCase()}</option>
                      ))}
                    </select>
                 </div>
              </div>
            </div>

            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || !content.trim()}
              className="w-full bg-indigo-600 text-white py-6 rounded-[35px] font-black text-xl hover:bg-indigo-700 transition-all shadow-2xl flex items-center justify-center gap-4"
            >
              {isAnalyzing && <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>}
              {isAnalyzing ? 'Kitap Mimarisi Çözümleniyor...' : 'Otonom Analizi Başlat'}
            </button>
          </div>
        ) : (
          <div className="space-y-12 animate-slide">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-indigo-50 p-10 rounded-[40px] border border-indigo-100">
                  <h4 className="font-black text-indigo-900 text-2xl mb-4">{analysis.title}</h4>
                  <p className="text-indigo-800/80 leading-relaxed text-lg mb-6">{analysis.summary}</p>
                  <div className="flex flex-wrap gap-4">
                    <span className="bg-white/50 text-indigo-700 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest">Niş: {analysis.detectedNiche}</span>
                    <span className="bg-white/50 text-indigo-700 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest">Mevcut Üslup: {analysis.currentTone}</span>
                    <span className="bg-white/50 text-indigo-700 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest">Tahmini {analysis.estimatedChapters} Segment</span>
                  </div>
                </div>

                {analysis.detectedChapters && analysis.detectedChapters.length > 0 && (
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Bölümleme Stratejisi</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => setChapterHandlingStrategy('detected')}
                        className={`p-6 rounded-[30px] border-2 text-left transition-all relative group ${
                          chapterHandlingStrategy === 'detected' 
                            ? 'border-indigo-600 bg-indigo-50 shadow-lg' 
                            : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-black text-slate-900">Orijinal Bölüm Yapısını Koru</p>
                          {chapterHandlingStrategy === 'detected' && (
                            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 scale-90">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 leading-tight pr-4">AI tarafından tespit edilen {analysis.detectedChapters.length} bölümü kullan.</p>
                      </button>
                      <button
                        onClick={() => setChapterHandlingStrategy('resegment')}
                        className={`p-6 rounded-[30px] border-2 text-left transition-all relative group ${
                          chapterHandlingStrategy === 'resegment' 
                            ? 'border-indigo-600 bg-indigo-50 shadow-lg' 
                            : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-black text-slate-900">AI Tarafından Yeni Bölümler Oluştur</p>
                          {chapterHandlingStrategy === 'resegment' && (
                            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 scale-90">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 leading-tight pr-4">AI'ın tahmini bölüm sayısına göre metni yeniden bölümle.</p>
                      </button>
                    </div>
                  </div>
                )}


                <div className="space-y-6">
                  <div className="flex items-center justify-between pl-2">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Otonom Revizyon Stratejileri (Çoklu Seçilebilir)</h4>
                    {selectedActionIds.length > 0 && (
                      <button 
                        onClick={() => setSelectedActionIds([])}
                        className="text-[10px] font-bold text-indigo-500 hover:underline"
                      >
                        Tümünü Kaldır
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.suggestedActions.map((action) => {
                      const isSelected = selectedActionIds.includes(action.id);
                      return (
                        <button
                          key={action.id}
                          onClick={() => toggleAction(action.id)}
                          className={`p-6 rounded-[30px] border-2 text-left transition-all relative group ${
                            isSelected 
                              ? 'border-indigo-600 bg-indigo-50 shadow-lg' 
                              : 'border-slate-100 hover:border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-black text-slate-900">{action.label}</p>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 scale-90">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 leading-tight pr-4">{action.description}</p>
                          {!isSelected && (
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-5 h-5 rounded-full border-2 border-slate-200"></div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Genişletme Katsayısı (Volume Expansion)</h4>
                    <span className="text-indigo-600 font-black text-lg">{expansionFactor}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="4" 
                    step="0.5" 
                    value={expansionFactor} 
                    onChange={(e) => setExpansionFactor(parseFloat(e.target.value))}
                    className="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                    <span>Orijinal Hacim</span>
                    <span>2 Kat Genişlet</span>
                    <span>4 Kat (Mega Eser)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-6">
                   <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Prompt Mühendisi Talimatları</h4>
                   <textarea 
                     value={customInstruction}
                     onChange={(e) => setCustomInstruction(e.target.value)}
                     className="w-full h-48 bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm text-slate-200 focus:border-indigo-500 outline-none resize-none"
                     placeholder="Ajanlara özel talimat verin: 'Betimlemeleri artır', 'Konu bütünlüğünü her bölümde vurgula', 'Daha fazla teknik detay ekle'..."
                   />
                </div>
                
                <button 
                  onClick={startProcess}
                  className="w-full bg-indigo-600 text-white py-8 rounded-[35px] font-black text-xl hover:bg-indigo-700 transition-all shadow-2xl"
                >
                  {selectedActionIds.length > 0 ? 'Seçili Stratejilerle Başlat' : 'Genel Revizyonu Başlat'}
                </button>
                <button onClick={() => setAnalysis(null)} className="w-full py-4 text-slate-400 font-bold">Ayarları Sıfırla</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RefactorerView;