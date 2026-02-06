import React, { useState } from 'react';
import { AIProvider } from '../types';
import { orchestratorService } from '../services/OrchestratorService';

const PROVIDERS: { id: AIProvider; label: string; envVar: string }[] = [
  { id: 'google', label: 'Google Gemini', envVar: 'GEMINI_API_KEY' },
  { id: 'openai', label: 'OpenAI (GPT-5/4)', envVar: 'OPENAI_API_KEY' },
  { id: 'anthropic', label: 'Anthropic (Claude)', envVar: 'ANTHROPIC_API_KEY' },
  { id: 'deepseek', label: 'DeepSeek', envVar: 'DEEPSEEK_API_KEY' },
  { id: 'fal-ai', label: 'Fal.ai (Flux)', envVar: 'FAL_AI_KEY' },
];

const APIKeyManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [keys, setKeys] = useState<Partial<Record<AIProvider, string>>>(() => {
    const saved = localStorage.getItem('kdp_api_keys');
    return saved ? JSON.parse(saved) : {};
  });
  const [errors, setErrors] = useState<Partial<Record<AIProvider, string>>>({});

  const validateKeys = (): boolean => {
    const newErrors: Partial<Record<AIProvider, string>> = {};

    // Required keys for basic functionality
    if (!keys.google?.trim()) {
      newErrors.google = 'Google Gemini API anahtarı gereklidir (metin üretimi için)';
    }
    if (!keys['fal-ai']?.trim()) {
      newErrors['fal-ai'] = 'Fal.ai API anahtarı gereklidir (kapak tasarımı için)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateKeys()) {
      return;
    }

    localStorage.setItem('kdp_api_keys', JSON.stringify(keys));
    Object.entries(keys).forEach(([provider, key]) => {
      const p = PROVIDERS.find(pr => pr.id === provider);
      if (p && key) {
        (window as any).process = (window as any).process || { env: {} };
        (window as any).process.env[p.envVar] = key;
      }
    });
    orchestratorService.refreshApiKeys();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        <div className="p-10 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">API Configuration</h2>
          <p className="text-slate-500 mt-2">Enter your API keys to enable multi-model orchestration. Keys are stored locally in your browser.</p>
        </div>
        
        <div className="p-10 space-y-6 max-h-[60vh] overflow-y-auto custom-scroll">
          {PROVIDERS.map((provider) => (
            <div key={provider.id} className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                {provider.label}
                {(provider.id === 'google' || provider.id === 'fal-ai') && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              <input
                type="password"
                value={keys[provider.id] || ''}
                onChange={(e) => {
                  setKeys({ ...keys, [provider.id]: e.target.value });
                  // Clear error on change
                  if (errors[provider.id]) {
                    setErrors({ ...errors, [provider.id]: undefined });
                  }
                }}
                placeholder={`Enter ${provider.label} API Key...`}
                className={`w-full p-4 rounded-2xl bg-slate-50 border ${
                  errors[provider.id] ? 'border-red-500' : 'border-slate-200'
                } focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-mono text-sm`}
              />
              {errors[provider.id] && (
                <p className="text-xs text-red-500 font-medium pl-1">{errors[provider.id]}</p>
              )}
            </div>
          ))}
        </div>

        <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default APIKeyManager;
