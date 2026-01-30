
import React, { useState } from 'react';
import { StorageService } from '../store';
import { translations } from '../translations';
import { User, NewsItem, LangType } from '../types';
import { AudioService } from '../services/audioService';

interface NewsProps {
  news: NewsItem[];
  user: User;
  lang: LangType;
  onRefresh: () => void;
  onDelete: (id: string, title: string) => void;
}

const News: React.FC<NewsProps> = ({ news, user, lang, onRefresh, onDelete }) => {
  const t = translations[lang];
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newItem: NewsItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      date: Date.now(),
      authorName: user.fullName,
    };
    StorageService.addNews(newItem);
    setIsAdding(false);
    onRefresh();
    AudioService.play('success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-black text-primary tracking-tighter uppercase">{t.news}</h2>
        {(user.role === 'admin' || user.role === 'teacher' || user.role === 'director') && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-accent text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-accent/20 neo-button"
          >
            + {t.add_news}
          </button>
        )}
      </div>

      <div className="space-y-8">
        {news.length > 0 ? (
          news.map(item => (
            <article key={item.id} className="glass-card p-10 rounded-[3rem] border border-muted/10 relative group hover:shadow-2xl transition-all">
               <div className="flex justify-between items-start mb-6">
                  <div>
                     <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em] block mb-2">{new Date(item.date).toLocaleDateString()}</span>
                     <h3 className="text-3xl font-black text-textMain tracking-tight leading-none">{item.title}</h3>
                  </div>
                  {(user.role === 'admin' || user.role === 'director' || item.authorName === user.fullName) && (
                    <button 
                      onClick={() => onDelete(item.id, item.title)} 
                      className="w-12 h-12 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all duration-300 shadow-sm hover:shadow-red-500/40 group/del"
                      title={t.delete}
                    >
                      <span className="text-xl group-hover/del:scale-110 transition-transform">🗑️</span>
                    </button>
                  )}
               </div>
               <p className="text-muted font-medium leading-relaxed mb-8 text-lg">{item.content}</p>
               <div className="flex items-center space-x-4 border-t border-muted/5 pt-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center font-black text-primary">{item.authorName.charAt(0)}</div>
                  <span className="text-xs font-black text-textMain uppercase tracking-widest opacity-60">{item.authorName}</span>
               </div>
            </article>
          ))
        ) : (
          <div className="text-center py-20 bg-surface border border-dashed border-muted/20 rounded-[3rem]">
             <span className="text-6xl block mb-6 grayscale opacity-30">📰</span>
             <p className="text-muted font-bold uppercase tracking-widest opacity-40">{t.no_data}</p>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="bg-surface w-full max-w-xl p-12 rounded-[3.5rem] shadow-2xl border border-muted/10 animate-in zoom-in-95">
            <h3 className="text-3xl font-black text-textMain mb-8 tracking-tighter uppercase">{t.add_news}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <input 
                name="title" 
                required 
                placeholder="Заголовок новости" 
                className="w-full bg-primary/5 border border-muted/10 rounded-2xl px-6 py-4 outline-none focus:border-accent transition-all text-textMain font-bold placeholder:text-muted/40" 
              />
              
              <textarea 
                name="content" 
                required 
                placeholder="Текст новости..." 
                rows={5} 
                className="w-full bg-primary/5 border border-muted/10 rounded-2xl px-6 py-4 outline-none focus:border-accent transition-all text-textMain font-medium resize-none placeholder:text-muted/40" 
              />
              
              <div className="flex space-x-4 pt-6">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 bg-muted/5 text-textMain/70 hover:text-textMain border border-muted/10 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all">{t.cancel}</button>
                <button type="submit" className="flex-1 bg-accent text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-accent/20">Опубликовать</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default News;
