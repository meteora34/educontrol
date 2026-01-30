
import React, { useState } from 'react';
import { translations } from '../translations';
import { AudioService } from '../services/audioService';
import { ThemeName, LangType } from '../types';

interface SettingsProps {
  lang: LangType;
  setLang: (l: LangType) => void;
  theme: ThemeName;
  changeTheme: (t: ThemeName) => void;
}

const Settings: React.FC<SettingsProps> = ({ lang, setLang, theme, changeTheme }) => {
  const t = translations[lang];
  const [volume, setVolume] = useState(AudioService.volume * 100);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    AudioService.setVolume(val / 100);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="glass-card p-10 rounded-4xl shadow-2xl border border-muted/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] pointer-events-none"></div>
        
        <h2 className="text-3xl font-black text-primary mb-10 flex items-center">
          <span className="mr-4 text-4xl">⚙️</span> {t.settings}
        </h2>

        <div className="space-y-12">
          <section>
            <h3 className="text-xs font-black text-muted uppercase tracking-[0.3em] mb-6">{t.language}</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'ru', label: t.russian, flag: '🇷🇺' },
                { id: 'ky', label: t.kyrgyz, flag: '🇰🇬' },
                { id: 'en', label: t.english, flag: '🇺🇸' }
              ].map(l => (
                <button 
                  key={l.id}
                  onClick={() => { setLang(l.id as any); }}
                  className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all group ${lang === l.id ? 'border-accent bg-accent/5 text-primary' : 'border-muted/10 text-muted'}`}
                >
                  <span className="text-2xl mb-2 group-hover:scale-125 transition-transform">{l.flag}</span>
                  <span className="font-bold text-xs tracking-tight">{l.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-black text-muted uppercase tracking-[0.3em] mb-6">{t.theme}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: 'arctic', label: 'Arctic', bg: 'bg-[#00A8FF]', icon: '❄️' },
                { id: 'dark', label: 'Midnight', bg: 'bg-[#242582]', icon: '🌑' },
                { id: 'light', label: 'Crystal', bg: 'bg-white border', icon: '☀️' },
                { id: 'cyber', label: 'Cyber', bg: 'bg-black', icon: '🧪' }
              ].map(th => (
                <button 
                  key={th.id}
                  onClick={() => changeTheme(th.id as ThemeName)}
                  className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center space-y-2 ${theme === th.id ? 'border-accent ring-4 ring-accent/20' : 'border-muted/10'}`}
                >
                  <div className={`w-10 h-10 rounded-xl ${th.bg} shadow-md flex items-center justify-center text-xl`}>{th.icon}</div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-textMain">{th.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-black text-muted uppercase tracking-[0.3em] mb-6">{t.volume}</h3>
            <div className="p-8 bg-primary/5 rounded-3xl border border-muted/5 flex items-center space-x-6">
              <span className="text-3xl">{volume === 0 ? '🔇' : '🔊'}</span>
              <input 
                type="range" min="0" max="100" value={volume} 
                onChange={handleVolumeChange}
                className="flex-1 accent-accent cursor-pointer h-2 rounded-full"
              />
              <span className="text-lg font-black text-primary w-12">{volume}%</span>
            </div>
          </section>
        </div>
      </div>

      <div className="bg-gradient-to-br from-primary to-accent rounded-4xl p-10 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative z-10">
            <h3 className="text-2xl font-black mb-2 italic tracking-tighter">EduControl Pro Digital ID</h3>
            <p className="opacity-80 text-sm font-bold uppercase tracking-[0.2em]">Arctic Edition • v3.1.0</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
