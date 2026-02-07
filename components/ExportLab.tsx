
import React, { useState } from 'react';
import { ExportSettings, Book } from '../types';

interface ExportLabProps {
  book: Book;
  onBack: () => void;
}

const ExportLab: React.FC<ExportLabProps> = ({ book, onBack }) => {
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'pdf',
    paperSize: '6x9',
    margins: 'normal'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExportClick = () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Preparation for PDF (browser print)
    if (settings.format === 'pdf') {
      const printContainer = document.getElementById('print-section');
      if (printContainer) {
        let printHtml = `
          <div style="padding: 40px; font-family: 'Merriweather', serif; color: black; background: white;">
            <div style="text-align: center; margin-top: 150px; page-break-after: always;">
              <h1 style="font-size: 42pt; margin-bottom: 10px; font-weight: 800;">${book.metadata.title}</h1>
              <h2 style="font-size: 20pt; color: #555; font-weight: 400; font-style: italic;">${book.metadata.subtitle || ''}</h2>
              <div style="margin-top: 200px; font-size: 16pt;">Yazar: Otonom AI Sistemi</div>
            </div>
        `;
        
        book.chapters.forEach((chapter, idx) => {
          printHtml += `
            <div class="page-break" style="margin-top: 50px;">
              <div style="text-align: center; margin-bottom: 40px;">
                <span style="text-transform: uppercase; font-size: 10pt; letter-spacing: 3px; color: #888;">Bölüm ${idx + 1}</span>
                <h3 style="font-size: 28pt; margin-top: 10px; font-weight: 700; border-bottom: 1px solid #ddd; padding-bottom: 20px;">
                  ${chapter.title}
                </h3>
              </div>
              <div style="font-size: 12.5pt; line-height: 2; text-align: justify; white-space: pre-wrap; font-weight: 400;">
                ${chapter.content}
              </div>
            </div>
            <div style="page-break-after: always;"></div>
          `;
        });
        
        printHtml += `</div>`;
        printContainer.innerHTML = printHtml;
      }
    }

    // Direct trigger for PDF generation
    setTimeout(() => {
      if (settings.format === 'pdf') {
        window.print();
      } else {
        // Download as Text for EPUB/Draft
        const fullText = book.chapters.map((c, i) => `Bölüm ${i + 1}: ${c.title}\n\n${c.content}`).join('\n\n' + '='.repeat(30) + '\n\n');
        const blob = new Blob([fullText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${book.metadata.title}_Tam_Metin.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      setIsProcessing(false);
    }, 1500);
    } catch (err: any) {
      setError(err.message || 'Dışa aktarma sırasında bir hata oluştu');
      setIsProcessing(false);
      console.error('Export error:', err);
    }
  };

  return (
    <div className="p-16 max-w-5xl mx-auto space-y-12 animate-slide">
      <div>
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Export <span className="text-indigo-600">Studio</span></h2>
        <p className="text-xl text-slate-500 font-medium">Baskıya hazır PDF veya dijital taslak formatında kitabınızı hemen indirin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Settings Panel */}
        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">1. İndirme Formatı</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setSettings({...settings, format: 'pdf'})}
                className={`p-6 rounded-3xl border-2 transition-all flex flex-col gap-2 ${settings.format === 'pdf' ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
              >
                <span className="text-2xl">📄</span>
                <span className="font-black text-lg text-slate-900">PDF (Hemen İndir)</span>
                <span className="text-xs text-slate-500 leading-tight">Amazon KDP baskı standartlarında PDF dosyası oluşturur.</span>
              </button>
              <button 
                onClick={() => setSettings({...settings, format: 'epub'})}
                className={`p-6 rounded-3xl border-2 transition-all flex flex-col gap-2 ${settings.format === 'epub' ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
              >
                <span className="text-2xl">📱</span>
                <span className="font-black text-lg text-slate-900">TXT (Dijital)</span>
                <span className="text-xs text-slate-500 leading-tight">Düzenlenebilir tam metin dosyasını indirir.</span>
              </button>
            </div>
          </section>

          {settings.format === 'pdf' && (
            <>
              <section className="space-y-4 animate-slide">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">2. Amazon Baskı Boyutu</h3>
                <div className="grid grid-cols-3 gap-3">
                  {['a4', 'letter', '6x9'].map((size) => (
                    <button 
                      key={size}
                      onClick={() => setSettings({...settings, paperSize: size as any})}
                      className={`py-4 rounded-2xl border-2 font-bold text-sm transition-all ${settings.paperSize === size ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500'}`}
                    >
                      {size.toUpperCase()}
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-4 animate-slide">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">3. Sayfa Marjları</h3>
                <div className="grid grid-cols-3 gap-3">
                  {['narrow', 'normal', 'wide'].map((margin) => (
                    <button 
                      key={margin}
                      onClick={() => setSettings({...settings, margins: margin as any})}
                      className={`py-4 rounded-2xl border-2 font-bold text-sm transition-all ${settings.margins === margin ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500'}`}
                    >
                      {margin.charAt(0).toUpperCase() + margin.slice(1)}
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        {/* Preview Visualization */}
        <div className="bg-slate-100 rounded-[40px] p-12 flex flex-col items-center justify-center border-2 border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 p-8">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Final Render</span>
          </div>
          
          <div className={`bg-white shadow-2xl transition-all duration-500 ${settings.format === 'pdf' ? 'aspect-[3/4] w-64' : 'aspect-[9/16] w-48'} rounded-lg p-6 relative border border-slate-200`}>
             {settings.format === 'pdf' && (
               <div className={`absolute inset-0 border-dashed border-indigo-200 transition-all pointer-events-none ${
                 settings.margins === 'narrow' ? 'm-2' : settings.margins === 'normal' ? 'm-6' : 'm-10'
               }`}></div>
             )}
             <div className="h-4 w-3/4 bg-slate-100 rounded mb-2"></div>
             <div className="h-2 w-full bg-slate-50 rounded mb-1"></div>
             <div className="h-2 w-full bg-slate-50 rounded mb-1"></div>
             <div className="h-2 w-2/3 bg-slate-50 rounded mb-1"></div>
          </div>

          <div className="mt-12 w-full space-y-4">
             <button 
               onClick={handleExportClick}
               disabled={isProcessing}
               className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 rounded-3xl font-black text-lg transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-4"
             >
               {isProcessing && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
               {isProcessing ? 'Kitap Derleniyor...' : (settings.format === 'pdf' ? 'PDF Oluştur ve İndir' : 'Metni İndir')}
             </button>
             {error && (
               <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-center">
                 <p className="text-sm font-bold text-red-700">{error}</p>
               </div>
             )}
             <button onClick={onBack} className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors">Stüdyoya Geri Dön</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportLab;