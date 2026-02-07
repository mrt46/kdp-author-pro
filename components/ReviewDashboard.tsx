import React, { useState } from 'react';
import { Book, Chapter } from '../types';

interface ReviewDashboardProps {
  book: Book;
  onBack: () => void;
  onRegenerateChapter: (chapterIndex: number) => void;
  onEditChapter: (chapterIndex: number) => void;
  onApproveAll: () => void;
  onPreview?: () => void;
}

const ReviewDashboard: React.FC<ReviewDashboardProps> = ({
  book,
  onBack,
  onRegenerateChapter,
  onEditChapter,
  onApproveAll,
  onPreview,
}) => {
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number | null>(null);

  const getStatusIcon = (status: Chapter['status']) => {
    return {
      completed: '✅',
      writing: '⏳',
      error: '❌',
      empty: '⚪',
      auditing: '🔍',
      revising: '✏️',
    }[status];
  };

  const getQualityScore = (chapter: Chapter): number => {
    // Simple quality heuristic
    if (chapter.status !== 'completed') return 0;
    if (chapter.wordCount < 500) return 40;
    if (chapter.wordCount < 1000) return 60;
    if (chapter.wordCount < 2000) return 80;
    return 95;
  };

  const totalWords = book.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
  const completedChapters = book.chapters.filter((ch) => ch.status === 'completed').length;

  return (
    <div className="flex h-full bg-slate-50">
      {/* Sidebar - Chapter List */}
      <div className="w-96 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <button
            onClick={onBack}
            className="text-slate-500 hover:text-slate-700 font-bold mb-4 transition-colors"
          >
            ← Back
          </button>
          <h2 className="text-2xl font-black text-slate-900">Review Chapters</h2>
          <p className="text-sm text-slate-500 mt-1">
            {completedChapters}/{book.chapters.length} completed
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {book.chapters.map((chapter, index) => {
            const qualityScore = getQualityScore(chapter);
            const isSelected =
              selectedChapter && selectedChapter.id === chapter.id;

            return (
              <button
                key={chapter.id}
                onClick={() => {
                  setSelectedChapter(chapter);
                  setSelectedChapterIndex(index);
                }}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-500 shadow-lg'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{getStatusIcon(chapter.status)}</span>
                  {chapter.status === 'completed' && (
                    <div
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        qualityScore >= 90
                          ? 'bg-green-100 text-green-700'
                          : qualityScore >= 70
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {qualityScore}/100
                    </div>
                  )}
                </div>
                <div className="font-bold text-slate-900 text-sm mb-1 line-clamp-2">
                  {chapter.title}
                </div>
                <div className="text-xs text-slate-500">
                  {chapter.wordCount.toLocaleString()} words
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={onApproveAll}
            disabled={completedChapters !== book.chapters.length}
            className="w-full bg-green-600 text-white py-3 rounded-2xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Approve All & Continue
          </button>
          <div className="text-center text-xs text-slate-500 mt-2">
            Total: {(totalWords / 1000).toFixed(1)}K words
          </div>
        </div>
      </div>

      {/* Main - Chapter Preview */}
      <div className="flex-1 flex flex-col">
        {selectedChapter && selectedChapterIndex !== null ? (
          <>
            {/* Header */}
            <div className="p-8 bg-white border-b border-slate-200">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-black text-slate-900">
                      {selectedChapter.title}
                    </h1>
                    <p className="text-slate-500 mt-1">
                      {selectedChapter.wordCount.toLocaleString()} words
                    </p>
                  </div>
                  <div
                    className={`text-3xl ${
                      selectedChapter.status === 'completed'
                        ? 'text-green-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {getStatusIcon(selectedChapter.status)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => onEditChapter(selectedChapterIndex)}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => onRegenerateChapter(selectedChapterIndex)}
                    className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all"
                  >
                    🔄 Regenerate
                  </button>
                  <button
                    onClick={onPreview}
                    disabled={!onPreview}
                    className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    👁️ Preview
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                  {selectedChapter.status === 'completed' ? (
                    <div className="prose prose-slate max-w-none">
                      {selectedChapter.content
                        .split('\n\n')
                        .map((paragraph, i) =>
                          paragraph.trim() ? (
                            <p key={i} className="mb-4 leading-relaxed">
                              {paragraph}
                            </p>
                          ) : null
                        )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">
                        {getStatusIcon(selectedChapter.status)}
                      </div>
                      <div className="text-xl font-bold text-slate-900 mb-2">
                        {selectedChapter.status === 'writing'
                          ? 'Chapter is being generated...'
                          : selectedChapter.status === 'error'
                          ? 'Generation failed'
                          : 'Chapter not yet generated'}
                      </div>
                      {selectedChapter.failureDiagnosis && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-left">
                          <div className="font-bold text-red-900 mb-2">Error Details:</div>
                          <div className="text-sm text-red-700">
                            {selectedChapter.failureDiagnosis}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Audit Notes */}
                {selectedChapter.auditNotes && (
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-3xl p-6">
                    <div className="font-bold text-blue-900 mb-2">Audit Notes:</div>
                    <div className="text-sm text-blue-700">{selectedChapter.auditNotes}</div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">👈</div>
              <div className="text-xl font-bold text-slate-900 mb-2">
                Select a chapter to review
              </div>
              <div className="text-slate-500">
                Choose a chapter from the sidebar to see its content
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewDashboard;
