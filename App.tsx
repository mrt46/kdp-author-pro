
import React, { useState, useEffect, useRef } from 'react';
import { Book, AppState, AgentLog, Chapter, TelemetryMetrics, LaunchKit, LegalAudit } from './types';
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
import LegalCounselView from './components/LegalCounselView';
import MarketingView from './components/MarketingView';
import IllustratorPanel from './components/IllustratorPanel';
import BookLibrary from './components/BookLibrary';
import CostDashboard from './components/CostDashboard';
import OriginalityCheckView from './components/OriginalityCheckView';
import ReviewDashboard from './components/ReviewDashboard';

const STORAGE_KEY = 'kdp-author-pro-books';
const STORAGE_ACTIVE = 'kdp-author-pro-active';

function loadBooks(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function loadActiveBookId(): string | null {
  return localStorage.getItem(STORAGE_ACTIVE);
}

const MAX_RETRIES = 5;

const App: React.FC = () => {
  const [view, setView] = useState<AppState>('book-library');
  const [books, setBooks] = useState<Book[]>(loadBooks);
  const [activeBookId, setActiveBookId] = useState<string | null>(loadActiveBookId);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [pendingStrategy, setPendingStrategy] = useState<any>(null);
  const [launchKit, setLaunchKit] = useState<LaunchKit | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [telemetry, setTelemetry] = useState<TelemetryMetrics>({
    actionLevel: 50, boredomLevel: 0, loreConsistency: 100, kdpCompliance: 100, activeAgent: 'Idle'
  });
  const [editingIllustration, setEditingIllustration] = useState<{id: string; prompt: string} | null>(null);
  const booksRef = useRef(books);
  booksRef.current = books;

  // localStorage persistence
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
        setSaveStatus('saved');
      } catch {
        setSaveStatus('idle');
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [books]);

  useEffect(() => {
    if (activeBookId) localStorage.setItem(STORAGE_ACTIVE, activeBookId);
    else localStorage.removeItem(STORAGE_ACTIVE);
  }, [activeBookId]);

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
      const currentBook = booksRef.current.find(b => b.id === bookId);
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

        // Calculate target word count for this chapter
        const targetForThisChapter =
          currentBook.chapters[chapterIndex].targetWordCount ||  // Prefer stored target
          currentBook.target?.currentProgress.adjustedAvgPerChapter ||  // Use adjusted average
          currentBook.target?.avgWordsPerChapter ||  // Fallback to initial average
          5000;  // Absolute fallback

        addLog('Writer', `Hedef: ~${targetForThisChapter} kelime (Deneme ${attempts + 1})...`);
        const content = await geminiService.writeChapter(currentBook.chapters[chapterIndex], currentBook.metadata, activeLore, targetForThisChapter, fixInstruction);
        
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
      const currentBook = booksRef.current.find(b => b.id === bookId);
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

      // Calculate target based on length
      const targetMap = {
        short: { words: 10000, pages: 40, chapters: outline.length },
        standard: { words: 37500, pages: 150, chapters: outline.length },
        long: { words: 75000, pages: 300, chapters: outline.length }
      };
      const target = targetMap[length];
      const avgWordsPerChapter = Math.round(target.words / target.chapters);

      const newBook: Book = {
        id: bookId,
        metadata: { title, subtitle: "", description: strategy.marketAnalysis, keywords: strategy.seoKeywords, categories: [], targetAudience: strategy.targetAudience, language, strategy, tone, targetLength: length },
        chapters: outline.map(ch => ({
          id: crypto.randomUUID(),
          title: ch.title || "Untitled",
          description: ch.description,
          content: "",
          wordCount: 0,
          targetWordCount: avgWordsPerChapter,  // Store target for each chapter
          status: 'empty'
        })),
        illustrations: [], trailers: [], loreBible: [], audits: [], legalAudits: [], originalityScans: [], originalityIssues: [],
        target: {
          totalWords: target.words,
          totalPages: target.pages,
          totalChapters: target.chapters,
          avgWordsPerChapter,
          currentProgress: {
            completedChapters: 0,
            currentWordCount: 0,
            remainingWords: target.words,
            adjustedAvgPerChapter: avgWordsPerChapter,
          },
        },
        createdAt: Date.now(), updatedAt: Date.now()
      };

      setBooks(prev => [...prev, newBook]);
      booksRef.current = [...booksRef.current, newBook];
      setActiveBookId(bookId);

      for (let i = 0; i < newBook.chapters.length; i++) {
        await runChapterLoop(bookId, i);

        // Update BookTarget progress
        const currentBook = booksRef.current.find(b => b.id === bookId);
        if (currentBook?.target) {
          const completedChapters = currentBook.chapters.filter(c => c.status === 'completed').length;
          const currentWordCount = currentBook.chapters
            .filter(c => c.status === 'completed')
            .reduce((sum, c) => sum + c.wordCount, 0);
          const remainingWords = currentBook.target.totalWords - currentWordCount;
          const remainingChapters = currentBook.target.totalChapters - completedChapters;
          const adjustedAvg = remainingChapters > 0
            ? Math.round(remainingWords / remainingChapters)
            : 0;

          updateBook(bookId, b => ({
            ...b,
            target: b.target ? {
              ...b.target,
              currentProgress: {
                completedChapters,
                currentWordCount,
                remainingWords,
                adjustedAvgPerChapter: adjustedAvg,
              },
            } : b.target,
          }));

          addLog('System Monitor', `İlerleme: ${completedChapters}/${currentBook.target.totalChapters} bölüm, ${currentWordCount.toLocaleString()}/${currentBook.target.totalWords.toLocaleString()} kelime (%${Math.round((currentWordCount / currentBook.target.totalWords) * 100)})`, 'info');
        }
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
      illustrations: [], trailers: [], loreBible: [], audits: [], legalAudits: [], originalityScans: [], originalityIssues: [], createdAt: Date.now(), updatedAt: Date.now()
    };

    setBooks(prev => [...prev, newBook]);
    booksRef.current = [...booksRef.current, newBook];
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

  // --- Chapter Management ---
  const handleAddChapter = () => {
    if (!activeBook) return;
    updateBook(activeBook.id, b => ({
      ...b,
      chapters: [...b.chapters, {
        id: crypto.randomUUID(),
        title: `New Chapter ${b.chapters.length + 1}`,
        content: '',
        wordCount: 0,
        status: 'empty' as const,
      }]
    }));
  };

  const handleDeleteChapter = (index: number) => {
    if (!activeBook || activeBook.chapters.length <= 1) return;
    updateBook(activeBook.id, b => ({
      ...b,
      chapters: b.chapters.filter((_, i) => i !== index)
    }));
    if (activeChapterIndex >= activeBook.chapters.length - 1) {
      setActiveChapterIndex(Math.max(0, activeBook.chapters.length - 2));
    }
  };

  const handleMoveChapter = (fromIndex: number, toIndex: number) => {
    if (!activeBook) return;
    updateBook(activeBook.id, b => {
      const chs = [...b.chapters];
      const [moved] = chs.splice(fromIndex, 1);
      chs.splice(toIndex, 0, moved);
      return { ...b, chapters: chs };
    });
    if (activeChapterIndex === fromIndex) setActiveChapterIndex(toIndex);
  };

  // --- SEO Optimization ---
  const handleOptimizeSEO = async () => {
    if (!activeBook) return;
    setIsGenerating(true);
    addLog('SEO Analyst', 'Analyzing keywords and competitor gaps...', 'info');
    try {
      const result = await geminiService.generateSEOKeywords(
        activeBook.metadata.title,
        activeBook.metadata.description,
        activeBook.metadata.language
      );
      updateBook(activeBook.id, b => ({
        ...b,
        metadata: {
          ...b.metadata,
          strategy: {
            ...b.metadata.strategy!,
            backendKeywords: result.backendKeywords.slice(0, 7),
            competitorGaps: result.competitorGaps,
          }
        }
      }));
      addLog('SEO Analyst', `Generated ${result.backendKeywords.length} backend keywords.`, 'success');
    } catch (e: any) {
      addLog('SEO Analyst', `SEO generation failed: ${e.message}`, 'critical');
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Legal Audit ---
  const handleRunLegalAudit = async () => {
    if (!activeBook) return;
    setIsGenerating(true);
    setTelemetry(p => ({ ...p, activeAgent: 'Legal' }));
    addLog('Legal Counsel', 'Initiating compliance deep-scan...', 'info');
    try {
      const fullContent = activeBook.chapters.map(c => c.content).join('\n\n');
      const result = await geminiService.runLegalAudit(fullContent, activeBook.metadata.title);
      const audit: LegalAudit = {
        id: crypto.randomUUID(),
        riskLevel: result.riskLevel,
        findings: result.findings,
        timestamp: Date.now(),
      };
      updateBook(activeBook.id, b => ({
        ...b,
        legalAudits: [audit, ...b.legalAudits]
      }));
      addLog('Legal Counsel', `Audit complete. Risk: ${result.riskLevel}`, result.riskLevel === 'low' ? 'success' : result.riskLevel === 'medium' ? 'warning' : 'critical');
    } catch (e: any) {
      addLog('Legal Counsel', `Audit failed: ${e.message}`, 'critical');
    } finally {
      setIsGenerating(false);
      setTelemetry(p => ({ ...p, activeAgent: 'Idle' }));
    }
  };

  // --- Illustrations ---
  const handleGenerateIllustration = async () => {
    if (!activeBook) return;
    setIsGenerating(true);
    addLog('Illustrator', 'Generating KDP cover concept using Flux 1.1 Pro...', 'info');

    try {
      // Prompt oluşturma (Normalde AI ajanı yapmalı, şimdilik basit bir şablon)
      const prompt = `Professional book cover for "${activeBook.metadata.title}". ${activeBook.metadata.description.slice(0, 100)}. Genre: ${activeBook.metadata.strategy?.niche || 'Non-fiction'}. High resolution, cinematic lighting, 8k, typography integration space.`;

      const imageUrl = await orchestratorService.generateImage(prompt);

      const newIllustration = {
        id: crypto.randomUUID(),
        url: imageUrl,
        prompt: prompt,
        type: 'cover' as const,
        createdAt: Date.now()
      };

      updateBook(activeBook.id, b => ({
        ...b,
        illustrations: [newIllustration, ...b.illustrations]
      }));

      addLog('Illustrator', 'Cover concept generated successfully.', 'success');
    } catch (e: any) {
      addLog('Illustrator', `Generation failed: ${e.message}`, 'critical');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditIllustration = (id: string, currentPrompt: string) => {
    setEditingIllustration({ id, prompt: currentPrompt });
    addLog('Illustrator', 'Kapak tasarımı düzenleme moduna alındı', 'info');
  };

  const handleConfirmEditIllustration = async (editedPrompt: string) => {
    if (!activeBook || !editingIllustration) return;

    setIsGenerating(true);
    addLog('Illustrator', 'Düzenlenmiş prompt ile yeni tasarım oluşturuluyor...', 'info');

    try {
      const imageUrl = await orchestratorService.generateImage(editedPrompt);

      updateBook(activeBook.id, b => {
        const illustrations = b.illustrations.map(ill =>
          ill.id === editingIllustration.id
            ? { ...ill, url: imageUrl, prompt: editedPrompt, createdAt: Date.now() }
            : ill
        );
        return { ...b, illustrations };
      });

      addLog('Illustrator', 'Tasarım başarıyla güncellendi', 'success');
      setEditingIllustration(null);
    } catch (e: any) {
      addLog('Illustrator', `Güncelleme başarısız: ${e.message}`, 'critical');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancelEditIllustration = () => {
    setEditingIllustration(null);
    addLog('Illustrator', 'Düzenleme iptal edildi', 'info');
  };

  // --- Marketing: Trailer & Launch Kit ---
  const handleSuggestTrailerPrompt = async (): Promise<string> => {
    if (!activeBook) return '';
    try {
      return await geminiService.suggestTrailerPrompt(activeBook.metadata.title, activeBook.metadata.description);
    } catch (e: any) {
      addLog('Marketing', `Prompt suggestion failed: ${e.message}`, 'critical');
      return '';
    }
  };

  const handleGenerateTrailer = async (prompt: string) => {
    if (!activeBook || !prompt) return;
    setIsGenerating(true);
    addLog('Marketing', 'Rendering cinematic trailer...', 'info');
    try {
      // Veo video generation is not available via current API; store prompt as placeholder trailer
      const trailer = { id: crypto.randomUUID(), videoUrl: '', prompt };
      updateBook(activeBook.id, b => ({ ...b, trailers: [...b.trailers, trailer] }));
      addLog('Marketing', 'Trailer prompt saved. Video rendering requires Veo API access.', 'warning');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateLaunchKit = async () => {
    if (!activeBook) return;
    setIsGenerating(true);
    addLog('Marketing', 'Synthesizing launch kit...', 'info');
    try {
      const kit = await geminiService.generateLaunchKit(
        activeBook.metadata.title,
        activeBook.metadata.description,
        activeBook.metadata.language
      );
      setLaunchKit(kit);
      addLog('Marketing', 'Launch kit generated successfully.', 'success');
    } catch (e: any) {
      addLog('Marketing', `Launch kit failed: ${e.message}`, 'critical');
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Micro Revision in Editor ---
  const handleApplyRevision = async (request: string) => {
    if (!activeBook) return;
    const chapter = activeBook.chapters[activeChapterIndex];
    if (!chapter.content) return;
    setIsGenerating(true);
    addLog('Revision Specialist', `Applying micro-revision: "${request.slice(0, 60)}..."`, 'info');
    try {
      const revised = await geminiService.refactorChapter(
        chapter.content,
        activeBook.metadata,
        [],
        { title: '', summary: '', detectedNiche: '', currentTone: '', estimatedChapters: 1, suggestedActions: [] },
        [],
        request,
        1,
      );
      updateBook(activeBook.id, b => {
        const chs = [...b.chapters];
        chs[activeChapterIndex] = { ...chs[activeChapterIndex], content: revised, wordCount: revised.split(/\s+/).length };
        return { ...b, chapters: chs };
      });
      addLog('Revision Specialist', 'Micro-revision applied.', 'success');
    } catch (e: any) {
      addLog('Revision Specialist', `Revision failed: ${e.message}`, 'critical');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectBook = (bookId: string) => {
    setActiveBookId(bookId);
    setActiveChapterIndex(0);
    setView('editor');
  };

  const handleDeleteBook = (bookId: string) => {
    setBooks(prev => prev.filter(b => b.id !== bookId));
    if (activeBookId === bookId) {
      setActiveBookId(null);
      setView('book-library');
    }
  };

  const handleRegenerateChapter = async (chapterIndex: number) => {
    if (!activeBook) return;
    await runChapterLoop(activeBook.id, chapterIndex);
  };

  const handleEditChapter = (chapterIndex: number) => {
    setActiveChapterIndex(chapterIndex);
    setView('editor');
  };

  const handleApproveAll = () => {
    // After approving all chapters, navigate to export or other view
    setView('export-lab');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0f172a] text-slate-100 font-sans">
      <Header view={view} setView={setView} bookTitle={activeBook?.metadata.title} hasBook={!!activeBook} onExport={() => {}} onExportPDF={() => setView('export-lab')} saveStatus={saveStatus} backgroundTasksCount={isGenerating ? 1 : 0} />
      <div className="flex flex-1 overflow-hidden">
        {activeBook && !['dashboard', 'strategy', 'orchestrator', 'book-config', 'book-refactorer', 'book-library', 'cost-dashboard', 'originality-check', 'review-dashboard'].includes(view) && (
          <Sidebar
            activeBook={activeBook}
            activeChapterIndex={activeChapterIndex}
            setActiveChapterIndex={setActiveChapterIndex}
            onAddChapter={handleAddChapter}
            onDeleteChapter={handleDeleteChapter}
            onMoveChapter={handleMoveChapter}
          />
        )}
        <main className="flex-1 overflow-y-auto bg-slate-50 text-slate-900 relative">
          {view === 'book-library' && (
            <BookLibrary
              books={books}
              onSelectBook={handleSelectBook}
              onNewBook={() => setView('strategy')}
              onDeleteBook={handleDeleteBook}
            />
          )}
          {view === 'cost-dashboard' && (
            <CostDashboard
              book={activeBook || undefined}
              onBack={() => setView(activeBook ? 'editor' : 'book-library')}
            />
          )}
          {view === 'originality-check' && activeBook && (
            <OriginalityCheckView
              book={activeBook}
              onBack={() => setView('editor')}
              updateBook={updateBook}
            />
          )}
          {view === 'review-dashboard' && activeBook && (
            <ReviewDashboard
              book={activeBook}
              onBack={() => setView('editor')}
              onRegenerateChapter={handleRegenerateChapter}
              onEditChapter={handleEditChapter}
              onApproveAll={handleApproveAll}
              onPreview={() => setView('preview')}
            />
          )}
          {view === 'dashboard' && <Dashboard onNewBook={() => setView('strategy')} onImportBook={() => setView('book-refactorer')} activeBook={activeBook} onContinue={() => setView('editor')} onSelectResource={() => {}} />}
          {view === 'strategy' && <StrategyPlanner onStrategySelected={(s, t, l) => { setPendingStrategy({ strategy: s, title: t, language: l }); setView('book-config'); }} addLog={addLog} logs={logs} />}
          {view === 'book-config' && pendingStrategy && <BookConfigView title={pendingStrategy.title} onStart={handleStartProduction} onBack={() => setView('strategy')} />}
          {view === 'orchestrator' && <OrchestratorView logs={logs} isGenerating={isGenerating} book={activeBook} onFinish={() => setView('editor')} telemetry={telemetry} />}
          {view === 'editor' && activeBook && (
            <Editor
              chapter={activeBook.chapters[activeChapterIndex]}
              onUpdate={(c) => updateBook(activeBook.id, b => { const chs = [...b.chapters]; chs[activeChapterIndex].content = c; chs[activeChapterIndex].wordCount = c.split(/\s+/).filter(Boolean).length; return { ...b, chapters: chs }; })}
              onAIRite={() => runChapterLoop(activeBook.id, activeChapterIndex)}
              onApplyRevision={handleApplyRevision}
              isGenerating={isGenerating}
              onFullAudit={() => {}}
              saveStatus={saveStatus}
              telemetry={telemetry}
              logs={logs}
            />
          )}
          {view === 'preview' && activeBook && <Preview book={activeBook} onBack={() => setView('editor')} />}
          {view === 'export-lab' && activeBook && <ExportLab book={activeBook} onBack={() => setView('editor')} />}
          {view === 'lore-bible' && activeBook && <LoreBibleView lore={activeBook.loreBible} onRefresh={() => {}} isGenerating={isGenerating} />}
          {view === 'book-refactorer' && <RefactorerView onRefactorStart={handleRefactorStart} addLog={addLog} />}
          {view === 'illustrations' && activeBook && (
            <IllustratorPanel
              book={activeBook}
              onGenerate={handleGenerateIllustration}
              onEdit={handleEditIllustration}
              isGenerating={isGenerating}
              pendingPrompt={editingIllustration}
              onConfirm={handleConfirmEditIllustration}
              onCancel={handleCancelEditIllustration}
            />
          )}
          {view === 'legal-audit' && activeBook && (
            <LegalCounselView
              book={activeBook}
              onRunAudit={handleRunLegalAudit}
              isGenerating={isGenerating}
            />
          )}
          {view === 'marketing' && activeBook && (
            <MarketingView
              trailers={activeBook.trailers}
              onGenerateTrailer={handleGenerateTrailer}
              onSuggestPrompt={handleSuggestTrailerPrompt}
              isGenerating={isGenerating}
              onGenerateKit={handleGenerateLaunchKit}
              launchKit={launchKit}
            />
          )}
        </main>
      </div>
      {activeBook && <VoiceCoach language={activeBook.metadata.language} />}
    </div>
  );
};

export default App;