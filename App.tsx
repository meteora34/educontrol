import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Attendance from './components/Attendance';
import Ratings from './components/Ratings';
import Auth from './components/Auth';
import Settings from './components/Settings';
import Schedule from './components/Schedule';
import Library from './components/Library';
import Profile from './components/Profile';
import DirectMessages from './components/DirectMessages';
import Groups from './components/Groups';
import News from './components/News';
import Toast, { ToastMessage } from './components/Toast';
import { User, ScheduleEntry, LibraryBook, Group, NewsItem, LangType, ThemeName } from './types';
import { StorageService } from './store';
import { translations } from './translations';
import { GeminiService } from './services/geminiService';
import { AudioService } from './services/audioService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lang, setLang] = useState<LangType>('ru');
  const [theme, setTheme] = useState<ThemeName>('arctic');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [library, setLibrary] = useState<LibraryBook[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'schedule' | 'book' | 'news' | 'group';
    id: string;
    title: string;
  } | null>(null);

  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [students, setStudents] = useState<any[]>([]);

  const t = translations[lang];

  useEffect(() => {
    const savedUser = localStorage.getItem('edu_session');
    const savedTheme = localStorage.getItem('edu_theme') as ThemeName;
    const savedLang = localStorage.getItem('edu_lang') as LangType;
    
    if (savedLang) setLang(savedLang);

    const initialTheme = savedTheme || 'arctic';
    setTheme(initialTheme);
    document.body.setAttribute('data-theme', initialTheme);
    if (initialTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    if (savedUser) {
      const u = JSON.parse(savedUser);
      const updatedUser = StorageService.handleUserStreak(u);
      setUser(updatedUser);
      setChatMessages(StorageService.getAIChatHistory(updatedUser.id));
    }
    refreshData();

    fetch("http://localhost:3001/api/students")
    .then(res => res.json())
    .then(data => setStudents(data))
    .catch(() => addToast("Сервер недоступен", "error"));
  }, []);

  const changeTheme = (newTheme: ThemeName) => {
    setTheme(newTheme);
    localStorage.setItem('edu_theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    AudioService.play('click');
  };

  const changeLang = (newLang: LangType) => {
    setLang(newLang);
    localStorage.setItem('edu_lang', newLang);
    AudioService.play('click');
  };

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, text, type }]);
    if (type === 'success') AudioService.play('success');
    if (type === 'error') AudioService.play('warning');
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(m => m.id !== id));
  };

  const refreshData = () => {
    setSchedule(StorageService.getSchedule());
    setLibrary(StorageService.getLibrary());
    setGroups(StorageService.getGroups());
    setNews(StorageService.getNews());
  };

  const executeDelete = () => {
    if (!deleteConfirm) return;
    
    AudioService.play('warning');
    const { type, id } = deleteConfirm;
    
    try {
      if (type === 'schedule') StorageService.deleteScheduleEntry(id);
      else if (type === 'book') StorageService.deleteLibraryBook(id);
      else if (type === 'news') StorageService.deleteNews(id);
      else if (type === 'group') StorageService.deleteGroup(id);
      
      refreshData();
      addToast(lang === 'en' ? 'Deleted successfully' : 'Успешно удалено', 'success');
    } catch (err) {
      addToast(lang === 'en' ? 'Delete failed' : 'Ошибка при удалении', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleLogin = (u: User) => {
    AudioService.play('success');
    const updatedUser = StorageService.handleUserStreak(u);
    setUser(updatedUser);
    setChatMessages(StorageService.getAIChatHistory(updatedUser.id));
    localStorage.setItem('edu_session', JSON.stringify(updatedUser));
    refreshData();
    addToast(`${t.login}: ${updatedUser.fullName}`, 'success');
  };

  const handleLogout = () => {
    AudioService.play('click');
    setUser(null);
    setChatMessages([]);
    localStorage.removeItem('edu_session');
    setActiveTab('dashboard');
  };

  const handleChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading || !user) return;

    AudioService.play('pop');
    const userMsg = chatInput;
    setChatInput('');
    
    const newUserMessages: {role: 'user' | 'model', text: string}[] = [...chatMessages, { role: 'user', text: userMsg }];
    setChatMessages(newUserMessages);
    StorageService.saveAIChatHistory(user.id, newUserMessages);
    
    setIsChatLoading(true);

    const history = newUserMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
    }));

    const response = await GeminiService.askAI(userMsg, history);
    AudioService.play('pop');
    
    const newAllMessages: {role: 'user' | 'model', text: string}[] = [...newUserMessages, { role: 'model', text: response }];
    setChatMessages(newAllMessages);
    StorageService.saveAIChatHistory(user.id, newAllMessages);
    
    setIsChatLoading(false);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  fetch("http://localhost:3001/api/students")
  .then(res => res.json())
  .then(data => setStudents(data))
  .catch(() => addToast("Сервер недоступен", "error"));


  if (!user) {
    return <Auth onLogin={handleLogin} lang={lang} setLang={changeLang} theme={theme} changeTheme={changeTheme} />;
  }

  return (
    <Layout user={user} activeTab={activeTab} setActiveTab={setActiveTab} lang={lang} setLang={changeLang} theme={theme} changeTheme={changeTheme} onLogout={handleLogout}>
      <div className="tab-enter tab-enter-active">
        {activeTab === 'dashboard' && <Dashboard user={user} lang={lang} />}
        {activeTab === 'attendance' && <Attendance user={user} lang={lang} onToast={addToast} />}
        {activeTab === 'ratings' && <Ratings lang={lang} currentUser={user} />}
        {activeTab === 'settings' && <Settings lang={lang} setLang={changeLang} theme={theme} changeTheme={changeTheme} />}
        {activeTab === 'schedule' && <Schedule schedule={schedule} user={user} lang={lang} onRefresh={refreshData} onToast={addToast} onDelete={(id, title) => setDeleteConfirm({type: 'schedule', id, title})} />}
        {activeTab === 'library' && <Library books={library} user={user} lang={lang} onRefresh={refreshData} onToast={addToast} onDelete={(id, title) => setDeleteConfirm({type: 'book', id, title})} />}
        {activeTab === 'profile' && <Profile user={user} lang={lang} onLogout={handleLogout} />}
        {activeTab === 'messages' && <DirectMessages currentUser={user} lang={lang} />}
        {activeTab === 'news' && <News news={news} user={user} lang={lang} onRefresh={refreshData} onDelete={(id, title) => setDeleteConfirm({type: 'news', id, title})} />}
        {activeTab === 'groups' && <Groups groups={groups} user={user} lang={lang} onRefresh={refreshData} onDelete={(id, title) => setDeleteConfirm({type: 'group', id, title})} />}
        {activeTab === 'chat' && (
             <div className="max-w-4xl mx-auto h-[calc(100vh-180px)] flex flex-col glass-card rounded-4xl shadow-2xl overflow-hidden border border-accent/20">
             <div className="p-6 bg-primary/10 border-b border-muted/10 flex items-center">
               <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white mr-4 glow-effect">🤖</div>
               <div>
                 <h3 className="font-bold text-textMain text-lg tracking-tight">{t.chat}</h3>
                 <p className="text-xs text-accent font-black uppercase tracking-widest">Neural Mentor • Active</p>
               </div>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-4">
               {chatMessages.map((msg, i) => (
                 <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] px-6 py-4 rounded-3xl ${msg.role === 'user' ? 'bg-primary text-white shadow-xl' : 'bg-surface text-textMain border border-muted/20 shadow-md'}`}>
                     <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                   </div>
                 </div>
               ))}
               {isChatLoading && <div className="animate-pulse text-muted text-xs font-bold uppercase tracking-widest ml-4">Thinking...</div>}
               <div ref={chatEndRef} />
             </div>
             <form onSubmit={handleChatSend} className="p-6 bg-surface/50 dark:bg-gray-900 border-t border-muted/10 flex space-x-3">
               <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={t.chat_placeholder} className="flex-1 bg-surface text-textMain border border-muted/20 rounded-2xl px-6 py-4 outline-none focus:border-accent transition-colors" />
               <button disabled={isChatLoading} className="bg-accent text-white p-4 rounded-2xl neo-button shadow-lg shadow-accent/20">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
               </button>
             </form>
           </div>
        )}
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface dark:bg-[#161642] w-full max-w-sm p-10 rounded-[3rem] shadow-2xl border border-white/10 text-center animate-in zoom-in-95">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">⚠️</div>
            <h3 className="text-2xl font-black text-textMain mb-4 tracking-tighter uppercase">{t.delete}?</h3>
            <p className="text-muted font-bold text-sm mb-8 leading-relaxed italic">"{deleteConfirm.title}"</p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setDeleteConfirm(null)} 
                className="flex-1 py-4 bg-black text-white/70 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border border-white/5"
              >
                {t.cancel}
              </button>
              <button 
                onClick={executeDelete} 
                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast messages={toasts} removeToast={removeToast} />
    </Layout>
  );
};

export default App;