import React, { useEffect, useState } from 'react';
import { orchestratorService } from '../services/OrchestratorService';
import { Book } from '../types';

interface CostDashboardProps {
  book: Book | null;
  onBack: () => void;
}

const CostDashboard: React.FC<CostDashboardProps> = ({ book, onBack }) => {
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const data = book
      ? orchestratorService.getBookCostBreakdown(book.id)
      : orchestratorService.getDetailedAnalytics();
    setAnalytics(data);
  }, [book]);

  if (!analytics) return <div className="p-8">Loading...</div>;

  const formatCost = (cost: number) => `$${cost.toFixed(4)}`;
  const formatDuration = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

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
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            💰 Cost Analytics
          </h1>
          <p className="text-slate-500 mt-2">
            {book ? `Cost breakdown for "${book.metadata.title}"` : 'All-time project costs'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Total Cost */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-3xl p-8 shadow-2xl">
            <div className="text-sm font-bold opacity-90 mb-2">TOTAL COST</div>
            <div className="text-5xl font-black">{formatCost(analytics.totalCost)}</div>
            <div className="text-sm opacity-80 mt-2">{analytics.count} API calls</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By Agent */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-4">By Agent</h3>
              <div className="space-y-3">
                {Object.entries(analytics.byAgent as Record<string, { cost: number; count: number }>)
                  .sort(([, a], [, b]) => b.cost - a.cost)
                  .map(([agent, data]) => {
                    const percentage = (data.cost / analytics.totalCost) * 100;
                    return (
                      <div key={agent} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900">{agent}</span>
                            <span className="text-sm text-slate-600">{formatCost(data.cost)}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {data.count} calls ({percentage.toFixed(1)}%)
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* By Model */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-4">By Model</h3>
              <div className="space-y-3">
                {Object.entries(analytics.byModel as Record<string, { cost: number; count: number }>)
                  .sort(([, a], [, b]) => b.cost - a.cost)
                  .map(([model, data]) => {
                    const percentage = (data.cost / analytics.totalCost) * 100;
                    return (
                      <div key={model} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900 text-sm">{model}</span>
                            <span className="text-sm text-slate-600">{formatCost(data.cost)}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {data.count} calls ({percentage.toFixed(1)}%)
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* By Provider */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-4">By Provider</h3>
              <div className="space-y-3">
                {Object.entries(analytics.byProvider as Record<string, { cost: number; count: number }>)
                  .sort(([, a], [, b]) => b.cost - a.cost)
                  .map(([provider, data]) => {
                    const percentage = (data.cost / analytics.totalCost) * 100;
                    return (
                      <div key={provider} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900 capitalize">{provider}</span>
                            <span className="text-sm text-slate-600">{formatCost(data.cost)}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {data.count} calls ({percentage.toFixed(1)}%)
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Bottleneck Analysis */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-4">⚠️ Bottlenecks</h3>
              {analytics.bottlenecks && analytics.bottlenecks.length > 0 ? (
                <div className="space-y-3">
                  {analytics.bottlenecks.slice(0, 5).map((bottleneck: any) => (
                    <div
                      key={bottleneck.chapterId}
                      className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-900 text-sm">
                          Chapter ID: {bottleneck.chapterId.slice(0, 8)}...
                        </span>
                        <span className="text-sm text-red-600 font-bold">
                          {formatCost(bottleneck.cost)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600">
                        {bottleneck.count} retries • Avg: {formatDuration(bottleneck.avgDuration)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No bottlenecks detected. Great!</p>
              )}
            </div>
          </div>

          {/* Per-Chapter Breakdown */}
          {book && Object.keys(analytics.byChapter).length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-4">Per-Chapter Cost</h3>
              <div className="space-y-3">
                {book.chapters.map((chapter) => {
                  const chapterData = analytics.byChapter[chapter.id];
                  if (!chapterData) return null;

                  return (
                    <div
                      key={chapter.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl"
                    >
                      <div className="flex-1">
                        <div className="font-bold text-slate-900">{chapter.title}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {chapterData.count} calls • Avg: {formatDuration(chapterData.avgDuration)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">{formatCost(chapterData.cost)}</div>
                        <div className="text-xs text-slate-500">
                          {((chapterData.cost / analytics.totalCost) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CostDashboard;
