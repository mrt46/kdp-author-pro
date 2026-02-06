import React, { useState } from 'react';
import { Book } from '../types';

interface BookLibraryProps {
  books: Book[];
  onSelectBook: (bookId: string) => void;
  onNewBook: () => void;
  onDeleteBook: (bookId: string) => void;
}

type ViewMode = 'grid' | 'list';

const BookLibrary: React.FC<BookLibraryProps> = ({
  books,
  onSelectBook,
  onNewBook,
  onDeleteBook,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBooks = books.filter((book) =>
    book.metadata.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (book: Book) => {
    const completedChapters = book.chapters.filter((ch) => ch.status === 'completed').length;
    const totalChapters = book.chapters.length;

    if (completedChapters === 0) {
      return { text: 'Draft', color: 'bg-gray-500' };
    } else if (completedChapters === totalChapters) {
      return { text: 'Ready', color: 'bg-green-600' };
    } else {
      return { text: 'In Progress', color: 'bg-yellow-600' };
    }
  };

  const getTotalWords = (book: Book) => {
    return book.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="p-8 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">📚 Book Library</h1>
              <p className="text-slate-500 mt-2">{books.length} book{books.length !== 1 && 's'} in your collection</p>
            </div>
            <button
              onClick={onNewBook}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              + New Book
            </button>
          </div>

          {/* Search & View Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              />
            </div>
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-indigo-600 shadow'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-indigo-600 shadow'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {filteredBooks.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400 text-lg">No books found. Create your first book!</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBooks.map((book) => {
                const status = getStatusBadge(book);
                const totalWords = getTotalWords(book);

                return (
                  <div
                    key={book.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all cursor-pointer group"
                    onClick={() => onSelectBook(book.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`${status.color} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                        {status.text}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${book.metadata.title}"?`)) {
                            onDeleteBook(book.id);
                          }
                        }}
                        className="text-slate-400 hover:text-red-600 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {book.metadata.title}
                    </h3>

                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                      {book.metadata.description || 'No description'}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>📄 {book.chapters.length} chapters</span>
                      <span>✍️ {(totalWords / 1000).toFixed(1)}K words</span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
                      Updated {formatDate(book.updatedAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBooks.map((book) => {
                const status = getStatusBadge(book);
                const totalWords = getTotalWords(book);

                return (
                  <div
                    key={book.id}
                    className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer group flex items-center gap-6"
                    onClick={() => onSelectBook(book.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {book.metadata.title}
                        </h3>
                        <div className={`${status.color} text-white text-xs font-bold px-2 py-1 rounded-full`}>
                          {status.text}
                        </div>
                      </div>
                      <p className="text-slate-500 text-sm line-clamp-1">
                        {book.metadata.description || 'No description'}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-slate-600">
                      <span>📄 {book.chapters.length} chapters</span>
                      <span>✍️ {(totalWords / 1000).toFixed(1)}K words</span>
                      <span className="text-xs text-slate-400">{formatDate(book.updatedAt)}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${book.metadata.title}"?`)) {
                          onDeleteBook(book.id);
                        }
                      }}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookLibrary;
