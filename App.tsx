
import React, { useState } from 'react';
import { Book, AppState, AgentLog, Chapter, TelemetryMetrics, DetectedChapter } from './types';
import { geminiService, RefactorAnalysis } from './services/geminiService';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Editor from './components/Editor';
import StrategyPlanner from './components/StrategyPlanner';
import OrchestratorView from './components/OrchestratorView';
import BookConfigView from './components/BookConfigView';
import Preview from './components/Preview';
import ExportLab from './components/ExportLab';
import VoiceCoach from './components/VoiceCoach';
import LoreBibleView from './components/LoreBibleView';
import RefactorerView from './components/RefactorerView';

const MAX_RETRIES = 5; // Artırıldı

const App: React.FC = () => {
  const [view, setView] = useState<AppState>('dashboard');
  const [books, setBooks] = useState<Book[]>([]);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [pendingStrategy, setPendingStrategy] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<TelemetryMetrics>({
    actionLevel: 50, boredomLevel: 0, loreConsistency: 100, kdpCompliance: 100, activeAgent: 'Idle'
  });

  const activeBook = books.find(b => b.id === activeBookId) || null;

  const addLog = (agent: string, message: string, type: AgentLog['type'] = 'info', details?: string) => {
    setLogs(prev => [{ id: crypto.randomUUID(), timestamp: Date.now(), agent, message, type, details }, ...prev].slice(0, 100));
  };

  const updateBook = (id: string, updater: (b: Book) => Book) => {
    setBooks(prev => prev.map(b => b.id === id ? updater(b) : b));
  };

  const runChapterLoop = async (bookId: string, chapterIndex: number) => {
    let attempts = 0;
    let isApproved = false;
    let fixInstruction = "";

    updateBook(bookId, b => {
      const chs = [...b.chapters];
      chs[chapterIndex].status = 'writing';
      chs[chapterIndex].failureDiagnosis = ''; // Clear previous diagnosis
      return { ...b, chapters: chs };
    });

    while (attempts < MAX_RETRIES && !isApproved) {
      const currentBook = books.find(b => b.id === bookId);
      if (!currentBook) break;

      try {
        // STEP 0: VECTOR RETRIEVAL (Semantic Search in Lore)
        setTelemetry(p => ({ ...p, activeAgent: 'Vector Retriever' }));
        addLog('Vector Retriever', `Searching Structured Memory for Chapter ${chapterIndex + 1} context...`);
        const activeLore = await geminiService.retrieveRelevantLore(
          currentBook.chapters[chapterIndex].description || currentBook.chapters[chapterIndex].title,
          currentBook.loreBible
        );
        addLog('Vector Retriever', `${activeLore.length} relevant entries injected into Writer's context.`, 'success');

        // STEP 1: WRITER STAGE
        setTelemetry(p => ({ ...p, activeAgent: 'Writer' }));
        addLog('Writer', `Generating draft using active context (Attempt ${attempts + 1})...`);
        const content = await geminiService.writeChapter(currentBook.chapters[chapterIndex], currentBook.metadata, activeLore, fixInstruction);
        
        // STEP 2: AUDITOR STAGE (Consistency Check)
        setTelemetry(p => ({ ...p, activeAgent: 'Auditor' }));
        addLog('Auditor', `Reviewing semantic consistency with Lore Bible...`);
        const audit = await geminiService.auditChapter(content, activeLore);
        
        if (audit.isPass) {
          // STEP 3: WORLD ARCHITECT STAGE
          setTelemetry(p => ({ ...p, activeAgent: 'World Architect' }));
          addLog('World Architect', `Approved (Score: ${audit.score}). Extracting new structured data...`, 'success');
          const newLore = await geminiService.extractLore(content);
          isApproved = true;

          updateBook(bookId, b => {
            const chs = [...b.chapters];
            chs[chapterIndex] = { ...chs[chapterIndex], content, status: 'completed', wordCount: content.split(/\s+/).length, auditNotes: audit.feedback, failureDiagnosis: '' };
            return { ...b, chapters: chs, loreBible: [...b.loreBible, ...newLore.map(l => ({...l, id: crypto.randomUUID(), isNew: true}))] };
          });
        } else {
          // STEP 4: SYSTEM ANALYST STAGE
          attempts++;
          setTelemetry(p => ({ ...p, activeAgent: 'System Analyst' }));
          addLog('System Analyst', `Consistency Breach: ${audit.feedback.slice(0, 80)}...`, 'warning');
          fixInstruction = await geminiService.diagnose("Consistency Audit Failed", audit.feedback);
          addLog('System Analyst', `Generated Fix Instruction: "${fixInstruction.slice(0, 80)}..."`, 'critical', fixInstruction);
          updateBook(bookId, b => {
            const chs = [...b.chapters];
            chs[chapterIndex].failureDiagnosis = fixInstruction;
            return { ...b, chapters: chs };
          });
        }
      } catch (e: any) {
        attempts++;
        addLog('System Monitor', `API Stall: ${e.message}. Retrying...`, 'critical', e.message);
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    if (!isApproved) {
      updateBook(bookId, b => {
        const chs = [...b.chapters];
        chs[chapterIndex].status = 'error';
        return { ...b, chapters: chs };
      });
    }
  };

  // Yeni revizyon döngüsü
  const runRefactorChapterLoop = async (
    bookId: string, 
    chapterIndex: number, 
    analysis: RefactorAnalysis, 
    selectedActionIds: string[], 
    customInstruction: string, 
    expansionFactor: number
  ) => {
    let attempts = 0;
    let isApproved = false;
    let fixInstruction = "";

    updateBook(bookId, b => {
      const chs = [...b.chapters];
      chs[chapterIndex].status = 'revising';
      chs[chapterIndex].failureDiagnosis = ''; // Clear previous diagnosis
      return { ...b, chapters: chs };
    });

    while (attempts < MAX_RETRIES && !isApproved) {
      const currentBook = books.find(b => b.id === bookId);
      if (!currentBook) break;

      try {
        // STEP 0: VECTOR RETRIEVAL (Semantic Search in Lore) - if lore exists
        setTelemetry(p => ({ ...p, activeAgent: 'Vector Retriever' }));
        addLog('Vector Retriever', `Searching Structured Memory for Chapter ${chapterIndex + 1} context...`);
        const activeLore = await geminiService.retrieveRelevantLore(
          currentBook.chapters[chapterIndex].description || currentBook.chapters[chapterIndex].title,
          currentBook.loreBible
        );
        addLog('Vector Retriever', `${activeLore.length} relevant entries injected into Revision Specialist's context.`, 'success');

        // STEP 1: REVISION SPECIALIST STAGE
        setTelemetry(p => ({ ...p, activeAgent: 'Revision Specialist' }));
        addLog('Revision Specialist', `Refactoring chapter content (Attempt ${attempts + 1})...`);
        const revisedContent = await geminiService.refactorChapter(
          currentBook.chapters[chapterIndex].content,
          currentBook.metadata,
          activeLore,
          analysis,
          selectedActionIds,
          customInstruction,
          expansionFactor,
          fixInstruction
        );
        
        // STEP 2: AUDITOR STAGE (Consistency Check)
        setTelemetry(p => ({ ...p, activeAgent: 'Auditor' }));
        addLog('Auditor', `Reviewing semantic consistency of refactored content with Lore Bible...`);
        const audit = await geminiService.auditChapter(revisedContent, activeLore);
        
        if (audit.isPass) {
          // STEP 3: WORLD ARCHITECT STAGE
          setTelemetry(p => ({ ...p, activeAgent: 'World Architect' }));
          addLog('World Architect', `Refactor Approved (Score: ${audit.score}). Extracting new structured data...`, 'success');
          const newLore = await geminiService.extractLore(revisedContent);
          isApproved = true;

          updateBook(bookId, b => {
            const chs = [...b.chapters];
            chs[chapterIndex] = { ...chs[chapterIndex], content: revisedContent, status: 'completed', wordCount: revisedContent.split(/\s+/).length, auditNotes: audit.feedback, failureDiagnosis: '' };
            return { ...b, chapters: chs, loreBible: [...b.loreBible, ...newLore.map(l => ({...l, id: crypto.randomUUID(), isNew: true}))] };
          });
        } else {
          // STEP 4: SYSTEM ANALYST STAGE
          attempts++;
          setTelemetry(p => ({ ...p, activeAgent: 'System Analyst' }));
          addLog('System Analyst', `Consistency Breach during refactor: ${audit.feedback.slice(0, 80)}...`, 'warning');
          fixInstruction = await geminiService.diagnose("Refactor Consistency Audit Failed", audit.feedback);
          addLog('System Analyst', `Generated Fix Instruction: "${fixInstruction.slice(0, 80)}..."`, 'critical', fixInstruction);
          // Store fixInstruction in failureDiagnosis for error state display
          updateBook(bookId, b => {
            const chs = [...b.chapters];
            chs[chapterIndex] = { ...chs[chapterIndex], failureDiagnosis: fixInstruction };
            return { ...b, chapters: chs };
          });
        }
      } catch (e: any) {
        attempts++;
        addLog('System Monitor', `API Stall during refactor: ${e.message}. Retrying...`, 'critical', e.message);
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    if (!isApproved) {
      updateBook(bookId, b => {
        const chs = [...b.chapters];
        chs[chapterIndex].status = 'error';
        return { ...b, chapters: chs };
      });
    }
  };


  const handleStartProduction = async (tone: string, length: 'short' | 'standard' | 'long') => {
    if (!pendingStrategy) return;
    const { strategy, title, language } = pendingStrategy;
    const bookId = crypto.randomUUID();
    
    setIsGenerating(true);
    setView('orchestrator');

    try {
      const outline = await geminiService.generateOutline(title, strategy, language, length);
      const newBook: Book = {
        id: bookId,
        metadata: { title, subtitle: "", description: strategy.marketAnalysis, keywords: strategy.seoKeywords, categories: [], targetAudience: strategy.targetAudience, language, strategy, tone, targetLength: length },
        chapters: outline.map(ch => ({ id: crypto.randomUUID(), title: ch.title || "Untitled", description: ch.description, content: "", wordCount: 0, status: 'empty' })),
        illustrations: [], trailers: [], loreBible: [], audits: [], legalAudits: [], createdAt: Date.now(), updatedAt: Date.now()
      };
      
      setBooks(prev => [...prev, newBook]);
      setActiveBookId(bookId);

      for (let i = 0; i < newBook.chapters.length; i++) {
        await runChapterLoop(bookId, i);
      }
    } finally {
      setIsGenerating(false);
      setTelemetry(p => ({ ...p, activeAgent: 'Idle' }));
    }
  };

  const handleRefactorStart = async (
    analysis: RefactorAnalysis, 
    importedContent: string, 
    actionIds: string[], 
    customInstruction: string, 
    expansionFactor: number, 
    selectedLanguage: string,
    chapterHandlingStrategy: 'detected' | 'resegment' // Yeni parametre
  ) => {
    addLog('Revision Specialist', 'Kitap revizyon süreci başlatılıyor.', 'info');
    
    const newBookId = crypto.randomUUID();
    let initialChapters: Chapter[] = [];

    if (chapterHandlingStrategy === 'detected' && analysis.detectedChapters && analysis.detectedChapters.length > 0) {
      // AI tarafından tespit edilen bölümleri kullan
      initialChapters = analysis.detectedChapters.map((detectedCh, i) => ({
        id: crypto.randomUUID(),
        title: detectedCh.title || `Revizyon Bölümü ${i + 1}`,
        description: `Orijinal içerikten alınan bölüm ${i + 1} revizyon için hazır.`,
        content: detectedCh.content,
        wordCount: detectedCh.content.split(/\s+/).length,
        status: 'revising',
        auditNotes: customInstruction,
        failureDiagnosis: '',
      }));
      addLog('Revision Specialist', `${initialChapters.length} adet orijinal bölüm tespit edildi ve kullanılıyor.`, 'success');
    } else {
      // AI'ın tahmini bölüm sayısına göre metni eşit parçalara böl (mevcut mantık)
      const chapterCount = Math.max(1, analysis.estimatedChapters);
      const chapterLength = Math.ceil(importedContent.length / chapterCount);
      for (let i = 0; i < chapterCount; i++) {
          const start = i * chapterLength;
          const end = Math.min((i + 1) * chapterLength, importedContent.length);
          const chapterContentSegment = importedContent.substring(start, end);
          initialChapters.push({
              id: crypto.randomUUID(),
              title: `Revizyon Bölümü ${i + 1}`,
              description: `Orijinal içerikten alınan bölüm ${i + 1} revizyon için hazır.`,
              content: chapterContentSegment,
              wordCount: chapterContentSegment.split(/\s+/).length,
              status: 'revising',
              auditNotes: customInstruction,
              failureDiagnosis: '',
          });
      }
      addLog('Revision Specialist', `Orijinal bölüm yapısı bulunamadı veya 'yeniden bölümle' seçeneği ile ${initialChapters.length} adet yeni bölüm oluşturuldu.`, 'info');
    }

    const newBook: Book = {
      id: newBookId,
      metadata: { 
        title: analysis.title, 
        subtitle: "Revize Edilen Sürüm", 
        description: analysis.summary, 
        keywords: [], 
        categories: [], 
        targetAudience: "Genel", 
        language: selectedLanguage, 
        tone: analysis.currentTone,
        targetLength: "standard", 
        strategy: {
            niche: analysis.detectedNiche,
            genre: "Genel", 
            targetAudience: "Genel", 
            pageCountGoal: initialChapters.length * 50, // Bölüm sayısına göre güncellendi
            marketAnalysis: analysis.summary,
            seoKeywords: [], 
        }
      },
      chapters: initialChapters,
      illustrations: [], trailers: [], loreBible: [], audits: [], legalAudits: [], createdAt: Date.now(), updatedAt: Date.now()
    };

    setBooks(prev => [...prev, newBook]);
    setActiveBookId(newBookId);
    
    setIsGenerating(true);
    setView('orchestrator');

    for (let i = 0; i < initialChapters.length; i++) {
      await runRefactorChapterLoop(
        newBookId, 
        i, 
        analysis, 
        actionIds, 
        customInstruction, 
        expansionFactor 
      );
    }

    setIsGenerating(false);
    setTelemetry(p => ({ ...p, activeAgent: 'Idle' }));
  };


  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0f172a] text-slate-100 font-sans">
      <Header view={view} setView={setView} bookTitle={activeBook?.metadata.title} hasBook={!!activeBook} onExport={() => {}} onExportPDF={() => setView('export-lab')} backgroundTasksCount={isGenerating ? 1 : 0} />
      <div className="flex flex-1 overflow-hidden">
        {activeBook && !['dashboard', 'strategy', 'orchestrator', 'book-config', 'book-refactorer'].includes(view) && (
          <Sidebar activeBook={activeBook} activeChapterIndex={activeChapterIndex} setActiveChapterIndex={setActiveChapterIndex} onAddChapter={() => {}} />
        )}
        <main className="flex-1 overflow-y-auto bg-slate-50 text-slate-900 relative">
          {view === 'dashboard' && <Dashboard onNewBook={() => setView('strategy')} onImportBook={() => setView('book-refactorer')} activeBook={activeBook} onContinue={() => setView('editor')} onSelectResource={() => {}} />}
          {view === 'strategy' && <StrategyPlanner onStrategySelected={(s, t, l) => { setPendingStrategy({ strategy: s, title: t, language: l }); setView('book-config'); }} addLog={addLog} logs={logs} />}
          {view === 'book-config' && pendingStrategy && <BookConfigView title={pendingStrategy.title} onStart={handleStartProduction} onBack={() => setView('strategy')} />}
          {view === 'orchestrator' && <OrchestratorView logs={logs} isGenerating={isGenerating} book={activeBook} onFinish={() => setView('editor')} telemetry={telemetry} />}
          {view === 'editor' && activeBook && <Editor chapter={activeBook.chapters[activeChapterIndex]} onUpdate={(c) => updateBook(activeBook.id, b => { const chs = [...b.chapters]; chs[activeChapterIndex].content = c; return { ...b, chapters: chs }; })} onAIRite={() => runChapterLoop(activeBook.id, activeChapterIndex)} onApplyRevision={() => {}} isGenerating={isGenerating} onFullAudit={() => {}} telemetry={telemetry} logs={logs} />}
          {view === 'preview' && activeBook && <Preview book={activeBook} />}
          {view === 'export-lab' && activeBook && <ExportLab book={activeBook} onBack={() => setView('editor')} />}
          {view === 'lore-bible' && activeBook && <LoreBibleView lore={activeBook.loreBible} onRefresh={() => {}} isGenerating={isGenerating} />}
          {view === 'book-refactorer' && <RefactorerView onRefactorStart={handleRefactorStart} addLog={addLog} />}
        </main>
      </div>
      {activeBook && <VoiceCoach language={activeBook.metadata.language} />}
    </div>
  );
};

export default App;