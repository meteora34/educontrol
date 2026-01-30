
import React, { useState } from 'react';
import { translations } from '../translations';
import { User, ThemeName, LangType } from '../types';
import { AudioService } from '../services/audioService';

interface LayoutProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lang: LangType;
  setLang: (l: LangType) => void;
  theme: ThemeName;
  changeTheme: (t: ThemeName) => void;
  children: React.ReactNode;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ user, activeTab, setActiveTab, lang, setLang, theme, changeTheme, children, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const t = translations[lang];

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: '📊', roles: ['student', 'teacher', 'admin', 'director'] },
    { id: 'news', label: t.news, icon: '📰', roles: ['student', 'teacher', 'admin', 'director'] },
    { id: 'messages', label: t.messages, icon: '✉️', roles: ['student', 'teacher', 'admin', 'director'], hasNotify: true },
    { id: 'chat', label: t.chat, icon: '🤖', roles: ['student', 'teacher', 'admin', 'director'] },
    { id: 'attendance', label: t.attendance, icon: '📅', roles: ['student', 'teacher', 'admin', 'director'] },
    { id: 'ratings', label: t.ratings, icon: '🏆', roles: ['student', 'teacher', 'admin', 'director'] },
    { id: 'schedule', label: t.schedule, icon: '⏰', roles: ['student', 'teacher', 'admin', 'director'] },
    { id: 'library', label: t.library, icon: '📚', roles: ['student', 'teacher', 'admin', 'director'] },
    { id: 'groups', label: t.groups, icon: '🏫', roles: ['admin', 'director'] },
    { id: 'settings', label: t.settings, icon: '⚙️', roles: ['student', 'teacher', 'admin', 'director'] },
  ].filter(item => !user || item.roles.includes(user.role));

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-8 px-5 bg-[var(--nav-bg)]">
      <div className="flex items-center space-x-4 px-2 mb-12">
        <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-accent/40 rotate-6 glow-effect">E</div>
        <span className="text-2xl font-extrabold tracking-tighter text-white">EduControl</span>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); AudioService.play('click'); }}
            className={`w-full relative flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
              activeTab === item.id 
                ? 'bg-accent text-white shadow-2xl shadow-accent/30 translate-x-2' 
                : 'text-white/70 hover:text-white hover:bg-white/10 hover:translate-x-1'
            }`}
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
            <span className="font-bold tracking-tight text-sm uppercase tracking-widest text-white whitespace-nowrap">{item.label}</span>
            {activeTab === item.id && (
              <span className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full"></span>
            )}
          </button>
        ))}
      </nav>

      <div className="pt-8 mt-8 border-t border-white/10 space-y-6">
        <div className="flex items-center justify-between bg-black/20 p-2 rounded-2xl border border-white/5">
            <div className="flex-1 flex justify-around">
                <button onClick={() => { setLang('ru'); }} className={`p-2 text-[10px] font-black rounded-xl transition-all ${lang === 'ru' ? 'bg-white/20 text-white' : 'text-white/50'}`}>RU</button>
                <button onClick={() => { setLang('ky'); }} className={`p-2 text-[10px] font-black rounded-xl transition-all ${lang === 'ky' ? 'bg-white/20 text-white' : 'text-white/50'}`}>KY</button>
                <button onClick={() => { setLang('en'); }} className={`p-2 text-[10px] font-black rounded-xl transition-all ${lang === 'en' ? 'bg-white/20 text-white' : 'text-white/50'}`}>EN</button>
            </div>
            <div className="w-px h-4 bg-white/10 mx-2"></div>
            <button onClick={() => { changeTheme(theme === 'dark' ? 'arctic' : 'dark'); }} className="p-2 flex justify-center text-lg hover:bg-white/10 rounded-xl transition-all">
                {theme === 'dark' ? '☀️' : '🌙'}
            </button>
        </div>
        <button onClick={onLogout} className="w-full flex items-center justify-center space-x-3 px-5 py-4 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/5 transition-all active:scale-95 group">
            <span className="group-hover:rotate-12 transition-transform">🚪</span>
            <span>{t.logout}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex font-sans transition-all duration-700`}>
      <aside className="hidden lg:block w-80 fixed h-full z-40 shadow-2xl">
        <SidebarContent />
      </aside>

      <main className="flex-1 lg:ml-80 relative min-h-screen flex flex-col bg-mesh-gradient">
        <header className="sticky top-0 z-30 glass-card px-8 py-6 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-3 -ml-3 text-primary hover:bg-primary/10 rounded-2xl transition-all">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <div className="ml-4 lg:ml-0">
               <h1 className="text-2xl font-black tracking-tight text-primary leading-none uppercase tracking-widest">
                {menuItems.find(m => m.id === activeTab)?.label}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
             {user && (
                <div className="flex items-center space-x-4 group cursor-pointer" onClick={() => setActiveTab('profile')}>
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-black text-textMain leading-tight group-hover:text-accent transition-colors">{user.fullName}</p>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-60">{t[user.role]}</p>
                  </div>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-black text-xl shadow-xl group-hover:scale-110 transition-transform">
                      {user.fullName.charAt(0)}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-background rounded-full"></span>
                  </div>
                </div>
             )}
          </div>
        </header>

        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>
      </main>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300" onClick={() => setIsMobileMenuOpen(false)}></div>
          <aside className="absolute top-0 left-0 w-80 h-full shadow-2xl animate-in slide-in-from-left duration-500 ease-out">
            <SidebarContent />
          </aside>
        </div>
      )}
    </div>
  );
};

export default Layout;
