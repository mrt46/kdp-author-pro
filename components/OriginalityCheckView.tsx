import React, { useState } from 'react';
import { Book, OriginalityScanResult, OriginalityIssueRecord } from '../types';
import { originalityService } from '../services/OriginalityService';
import { orchestratorService } from '../services/OrchestratorService';

interface OriginalityCheckViewProps {
  book: Book;
  onBack: () => void;
  updateBook: (id: string, updater: (b: Book) => Book) => void;
}

const OriginalityCheckView: React.FC<OriginalityCheckViewProps> = ({ book, onBack, updateBook }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [rewritingIssueId, setRewritingIssueId] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<OriginalityScanResult | null>(
    book.originalityScans && book.originalityScans.length > 0
      ? book.originalityScans[0]
      : null
  );

  const [enabledPhases, setEnabledPhases] = useState({
    internal: true,
    external: true,
    aiDetection: false, // Disabled by default as requested
  });

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const { scanResult, newIssues, resolvedIssues, persistentIssues } =
        await originalityService.scanBookWithTracking(book, enabledPhases);

      // Update book's originality data
      updateBook(book.id, (b) => ({
        ...b,
        originalityScans: [scanResult, ...b.originalityScans],
        originalityIssues: [
          ...newIssues,
          ...persistentIssues,
          ...resolvedIssues,
          ...b.originalityIssues.filter((i) => i.status !== 'pending'), // Keep ignored/documented
        ],
      }));

      setScanResult(scanResult);

      // Show feedback
      if (newIssues.length > 0) {
        console.log(`Tarama tamamlandı: ${newIssues.length} yeni sorun tespit edildi`);
      }
      if (resolvedIssues.length > 0) {
        console.log(`${resolvedIssues.length} sorun çözüldü`);
      }
    } catch (error) {
      console.error('Tarama başarısız:', error);
      alert('Tarama başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAutoRewrite = async (issue: OriginalityIssueRecord) => {
    setRewritingIssueId(issue.id);
    try {
      // AI call to rewrite
      const response = await orchestratorService.request(
        'content_generation',
        `Aşağıdaki paragrafı özgünlük kaybetmeden anlamını koruyarak yeniden yaz:\n\n"${issue.originalText}"`,
        {
          agent: 'Revision Specialist',
          bookId: book.id,
          chapterId: issue.chapterId,
          isJson: false,
        }
      );

      const rewrittenText = response.content as string;

      // Update chapter content
      updateBook(book.id, (b) => {
        const chapters = [...b.chapters];
        const chapterIndex = chapters.findIndex((c) => c.id === issue.chapterId);
        if (chapterIndex === -1) return b;

        const chapter = chapters[chapterIndex];
        const paragraphs = chapter.content.split('\n\n');
        paragraphs[issue.paragraphIndex] = rewrittenText;
        chapters[chapterIndex] = {
          ...chapter,
          content: paragraphs.join('\n\n'),
          wordCount: paragraphs.join('\n\n').split(/\s+/).length,
        };

        // Mark issue as resolved
        const issues = b.originalityIssues.map((i) =>
          i.id === issue.id
            ? {
                ...i,
                status: 'resolved' as const,
                resolvedAt: Date.now(),
                resolutionMethod: 'auto-rewrite' as const,
                revisedText: rewrittenText,
              }
            : i
        );

        return { ...b, chapters, originalityIssues: issues };
      });

      console.log('Paragraf başarıyla yeniden yazıldı');
    } catch (error) {
      console.error('Yeniden yazma başarısız:', error);
      alert('Yeniden yazma işlemi başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setRewritingIssueId(null);
    }
  };

  const handleKeepAndDocument = (issue: OriginalityIssueRecord) => {
    const userNote = prompt('Bu sorunu neden saklıyorsunuz? (opsiyonel not):');

    updateBook(book.id, (b) => ({
      ...b,
      originalityIssues: b.originalityIssues.map((i) =>
        i.id === issue.id
          ? {
              ...i,
              status: 'ignored' as const,
              resolvedAt: Date.now(),
              resolutionMethod: 'kept-documented' as const,
              userNotes: userNote || 'Kullanıcı tarafından onaylandı',
            }
          : i
      ),
    }));

    console.log('Sorun belgelendi ve saklandı');
  };

  const handleDelete = (issue: OriginalityIssueRecord) => {
    if (!confirm('Bu paragrafı silmek istediğinizden emin misiniz?')) return;

    updateBook(book.id, (b) => {
      const chapters = [...b.chapters];
      const chapterIndex = chapters.findIndex((c) => c.id === issue.chapterId);
      if (chapterIndex === -1) return b;

      const chapter = chapters[chapterIndex];
      const paragraphs = chapter.content.split('\n\n');
      paragraphs.splice(issue.paragraphIndex, 1); // Remove paragraph
      chapters[chapterIndex] = {
        ...chapter,
        content: paragraphs.join('\n\n'),
        wordCount: paragraphs.join('\n\n').split(/\s+/).length,
      };

      // Mark issue as resolved
      const issues = b.originalityIssues.map((i) =>
        i.id === issue.id
          ? {
              ...i,
              status: 'resolved' as const,
              resolvedAt: Date.now(),
              resolutionMethod: 'deleted' as const,
            }
          : i
      );

      return { ...b, chapters, originalityIssues: issues };
    });

    console.log('Paragraf silindi');
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      safe: { text: '✅ SAFE TO PUBLISH', color: 'bg-green-600' },
      'review-required': { text: '⚠️ REVIEW REQUIRED', color: 'bg-yellow-600' },
      unsafe: { text: '🚫 DO NOT PUBLISH', color: 'bg-red-600' },
    };
    return badges[status as keyof typeof badges] || badges.safe;
  };

  const getSeverityIcon = (severity: string) => {
    return {
      low: 'ℹ️',
      medium: '⚠️',
      high: '🚨',
    }[severity];
  };

  // Filter issues
  const pendingIssues = book.originalityIssues.filter((i) => i.status === 'pending');
  const resolvedIssues = book.originalityIssues.filter((i) => i.status === 'resolved');

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="p-8 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={onBack}
            className="text-slate-500 hover:text-slate-700 font-bold mb-4 transition-colors"
          >
            ← Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                🛡️ Originality Guardian
              </h1>
              <p className="text-slate-500 mt-2">Plagiarism & AI detection for "{book.metadata.title}"</p>
            </div>
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? 'Scanning...' : 'Run Full Scan'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Scan Options */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-4">Scan Options</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabledPhases.internal}
                  onChange={(e) =>
                    setEnabledPhases({ ...enabledPhases, internal: e.target.checked })
                  }
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <div>
                  <div className="font-bold text-slate-900">Phase 1: Internal Consistency</div>
                  <div className="text-sm text-slate-500">Check for duplicate paragraphs within the book</div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabledPhases.external}
                  onChange={(e) =>
                    setEnabledPhases({ ...enabledPhases, external: e.target.checked })
                  }
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <div>
                  <div className="font-bold text-slate-900">Phase 2: External Similarity</div>
                  <div className="text-sm text-slate-500">Check against Google Books & web sources</div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabledPhases.aiDetection}
                  onChange={(e) =>
                    setEnabledPhases({ ...enabledPhases, aiDetection: e.target.checked })
                  }
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <div>
                  <div className="font-bold text-slate-900">Phase 3: AI Detection (Beta)</div>
                  <div className="text-sm text-slate-500">Detect AI-generated content signatures</div>
                </div>
              </label>
            </div>
          </div>

          {scanResult && (
            <>
              {/* Overall Score */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-3xl p-8 shadow-2xl">
                <div className="text-sm font-bold opacity-90 mb-2">ORIGINALITY SCORE</div>
                <div className="text-6xl font-black mb-4">{scanResult.overallScore}/100</div>
                <div
                  className={`inline-block ${getStatusBadge(scanResult.status).color} text-white text-sm font-bold px-4 py-2 rounded-full`}
                >
                  {getStatusBadge(scanResult.status).text}
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm opacity-75">Internal</div>
                    <div className="text-2xl font-bold">{scanResult.internalScore}/100</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-75">External</div>
                    <div className="text-2xl font-bold">{scanResult.externalScore}/100</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-75">AI Detection</div>
                    <div className="text-2xl font-bold">{scanResult.aiDetectionScore}/100</div>
                  </div>
                </div>
              </div>

              {/* Pending Issues */}
              {pendingIssues.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-black text-slate-900 mb-4">
                    🚨 Bekleyen Sorunlar ({pendingIssues.length})
                  </h3>
                  <div className="space-y-4">
                    {pendingIssues.map((issue) => (
                      <div
                        key={issue.id}
                        className="p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl hover:border-indigo-300 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getSeverityIcon(issue.severity)}</span>
                            <div>
                              <div className="font-bold text-slate-900">
                                {issue.chapterTitle} • Para {issue.paragraphIndex + 1}
                              </div>
                              <div className="text-sm text-slate-500">{issue.details}</div>
                            </div>
                          </div>
                          {issue.matchPercentage && (
                            <div className="text-right">
                              <div
                                className={`text-2xl font-black ${getScoreColor(100 - issue.matchPercentage)}`}
                              >
                                {issue.matchPercentage}%
                              </div>
                              <div className="text-xs text-slate-500">Match</div>
                            </div>
                          )}
                        </div>

                        <div className="p-3 bg-white border border-slate-200 rounded-xl mb-3">
                          <div className="text-sm text-slate-700 font-mono">{issue.text}</div>
                        </div>

                        {issue.autoFixSuggestion && (
                          <div className="flex items-center gap-2 text-sm mb-3">
                            <span className="text-indigo-600 font-bold">💡 Öneri:</span>
                            <span className="text-slate-600">{issue.autoFixSuggestion}</span>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAutoRewrite(issue)}
                            disabled={rewritingIssueId === issue.id}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {rewritingIssueId === issue.id ? 'Yazılıyor...' : 'Auto-Rewrite'}
                          </button>
                          <button
                            onClick={() => handleKeepAndDocument(issue)}
                            className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-300 transition-all"
                          >
                            Keep & Document
                          </button>
                          <button
                            onClick={() => handleDelete(issue)}
                            className="px-4 py-2 bg-red-100 text-red-700 text-sm font-bold rounded-xl hover:bg-red-200 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolved Issues */}
              {resolvedIssues.length > 0 && (
                <details className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                  <summary className="text-lg font-black text-slate-900 cursor-pointer">
                    ✅ Çözülen Sorunlar ({resolvedIssues.length})
                  </summary>
                  <div className="mt-4 space-y-2">
                    {resolvedIssues.map((issue) => (
                      <div key={issue.id} className="p-3 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-slate-700">
                            <strong>{issue.chapterTitle}</strong> • Para {issue.paragraphIndex + 1}
                          </div>
                          <div className="text-xs text-green-700 font-bold">
                            {issue.resolutionMethod === 'auto-rewrite' && 'Yeniden Yazıldı'}
                            {issue.resolutionMethod === 'manual-edit' && 'Manuel Düzenlendi'}
                            {issue.resolutionMethod === 'kept-documented' && 'Saklandı'}
                            {issue.resolutionMethod === 'deleted' && 'Silindi'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {pendingIssues.length === 0 && (
                <div className="bg-green-50 border-2 border-green-200 rounded-3xl p-8 text-center">
                  <div className="text-6xl mb-4">✅</div>
                  <div className="text-2xl font-black text-green-900">Hepsi Temiz!</div>
                  <div className="text-green-700 mt-2">Özgünlük sorunu tespit edilmedi. Yayınlamak güvenli.</div>
                </div>
              )}

              {/* Scanned Sources */}
              {scanResult.scannedSources.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-black text-slate-900 mb-4">Taranan Kaynaklar</h3>
                  <div className="text-sm text-slate-600">
                    {scanResult.scannedSources.slice(0, 10).map((source, i) => (
                      <div key={i} className="py-2 border-b border-slate-100 last:border-0">
                        • {source}
                      </div>
                    ))}
                    {scanResult.scannedSources.length > 10 && (
                      <div className="text-slate-400 mt-2">
                        ... ve {scanResult.scannedSources.length - 10} kaynak daha
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {!scanResult && !isScanning && (
            <div className="bg-white rounded-3xl p-12 border-2 border-dashed border-slate-300 text-center">
              <div className="text-6xl mb-4">🛡️</div>
              <div className="text-2xl font-black text-slate-900 mb-2">Taramaya Hazır</div>
              <div className="text-slate-500">
                Özgünlüğü kontrol etmek ve intihal tespiti için "Run Full Scan" tıklayın
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OriginalityCheckView;
