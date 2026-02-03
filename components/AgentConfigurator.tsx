
import React, { useState } from 'react';
import { AIProfile, ModelAssignment } from '../types';

interface AgentConfiguratorProps {
  onConfirm: (config: ModelAssignment) => void;
  onCancel: () => void;
}

const PROFILE_INFO = {
  Reasoning: {
    label: 'Reasoning (DeepSeek-style)',
    desc: 'Yüksek akıl yürütme, tutarlılık ve mantık analizi. Taslak ve Denetim için ideal.',
    icon: '🧠',
    color: 'indigo'
  },
  Creative: {
    label: 'Creative (GPT-style)',
    desc: 'Sürükleyici dil, betimleyici anlatım ve yaratıcı akış. Yazım için ideal.',
    icon: '✨',
    color: 'purple'
  },
  Balanced: {
    label: 'Balanced',
    desc: 'Hız ve kalite arasında orta nokta. Her görev için güvenli seçim.',
    icon: '⚖️',
    color: 'blue'
  },
  Turbo: {
    label: 'Turbo (Flash)',
    desc: 'Hızlı sonuç, temel dil bilgisi kontrolü. Basit düzeltmeler için uygun.',
    icon: '⚡',
    color: 'amber'
  }
};

const AgentConfigurator: React.FC<AgentConfiguratorProps> = ({ onConfirm, onCancel }) => {
  const [config, setConfig] = useState<ModelAssignment>({
    outline: 'Reasoning',
    writing: 'Creative',
    auditing: 'Reasoning'
  });

  const renderCard = (role: keyof ModelAssignment, title: string) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{title} Ajanı</h4>
      <div className="grid grid-cols-1 gap-2">
        {(Object.keys(PROFILE_INFO) as AIProfile[]).map((profile) => {
          const info = PROFILE_INFO[profile];
          const isSelected = config[role] === profile;
          return (
            <button
              key={profile}
              onClick={() => setConfig({ ...config, [role]: profile })}
              className={`p-3 rounded-2xl text-left border-2 transition-all flex items-start gap-3 ${
                isSelected 
                ? `border-${info.color}-500 bg-${info.color}-50 shadow-md` 
                : 'border-slate-100 hover:border-slate-200 bg-white'
              }`}
            >
              <span className="text-2xl">{info.icon}</span>
              <div className="flex-1">
                <p className={`text-sm font-bold ${isSelected ? `text-${info.color}-900` : 'text-slate-800'}`}>
                  {info.label}
                </p>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">{info.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center">
        <h2 className="text-4xl font-black text-slate-900 mb-2">Ajan Kadrosunu Konfigüre Et</h2>
        <p className="text-slate-500">Kitabınızın her aşaması için farklı "AI Uzmanları" atayın.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderCard('outline', 'Mimari & Taslak')}
        {renderCard('writing', 'Metin Yazımı')}
        {renderCard('auditing', 'Kalite & Denetim')}
      </div>

      <div className="bg-indigo-600 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-100">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">Simülasyon Hazır</h3>
          <p className="text-indigo-100 text-sm">
            {config.outline} ajanı taslağı çizecek, {config.writing} ajanı bölümleri yazacak ve {config.auditing} ajanı tüm kitabı denetleyecek.
          </p>
        </div>
        <div className="flex gap-4">
          <button onClick={onCancel} className="px-6 py-3 font-bold text-indigo-200 hover:text-white transition-colors">Vazgeç</button>
          <button 
            onClick={() => onConfirm(config)}
            className="bg-white text-indigo-600 px-10 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all"
          >
            Yazımı Başlat
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentConfigurator;