
import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-8">
          <div className="glass rounded-[40px] p-16 max-w-lg w-full text-center border border-white/10">
            <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-rose-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter mb-4">Runtime Error</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-2">An unexpected error occurred in the application.</p>
            <pre className="text-rose-400 text-xs bg-black/30 rounded-xl p-4 mt-4 mb-8 text-left overflow-auto max-h-40 border border-rose-500/10">
              {this.state.error?.message}
            </pre>
            <button
              onClick={this.handleReset}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20"
            >
              Recover & Restart
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
