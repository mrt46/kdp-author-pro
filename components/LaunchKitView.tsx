
import React from 'react';
import { LaunchKit } from '../types';

interface LaunchKitViewProps {
  kit: LaunchKit;
}

const LaunchKitView: React.FC<LaunchKitViewProps> = ({ kit }) => {
  return (
    <div className="p-10 max-w-5xl mx-auto space-y-10 pb-32">
      <div className="mb-6">
        <h2 className="text-3xl font-black text-slate-900">Sosyal Medya Lansman Kiti</h2>
        <p className="text-slate-500">Kitabınızın tanıtımı için hazırlanan otonom içerikler.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-indigo-600 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            Instagram Reels / Post Captions
          </h3>
          <div className="space-y-4">
            {kit.instagram.map((post, i) => (
              <div key={i} className="bg-slate-50 p-4 rounded-2xl text-sm text-slate-700 leading-relaxed border border-slate-100">
                {post}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-sky-500 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            Twitter (X) Threads
          </h3>
          <div className="space-y-4">
            {kit.twitter.map((tweet, i) => (
              <div key={i} className="bg-slate-50 p-4 rounded-2xl text-sm text-slate-700 leading-relaxed border border-slate-100">
                {tweet}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-900 text-white p-8 rounded-3xl shadow-xl">
          <h3 className="font-bold text-amber-400 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            Lansman E-postası
          </h3>
          <pre className="whitespace-pre-wrap font-sans text-sm text-slate-300 leading-relaxed bg-slate-800 p-6 rounded-2xl border border-slate-700">
            {kit.email}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default LaunchKitView;