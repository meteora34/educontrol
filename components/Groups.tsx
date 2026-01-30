import React, { useState } from 'react';
import { StorageService } from '../store';
import { translations } from '../translations';
import { User, Group, LangType } from '../types';
import { AudioService } from '../services/audioService';

interface GroupsProps {
  groups: Group[];
  user: User;
  lang: LangType;
  onRefresh: () => void;
  onDelete: (id: string, title: string) => void;
}

const Groups: React.FC<GroupsProps> = ({ groups, user, lang, onRefresh, onDelete }) => {
  const t = translations[lang];
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newGroup: Group = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      department: formData.get('department') as string,
      course: parseInt(formData.get('course') as string) || 1,
    };
    StorageService.addGroup(newGroup);
    setIsAdding(false);
    onRefresh();
    AudioService.play('success');
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-black text-primary tracking-tighter uppercase">{t.groups}</h2>
        {(user.role === 'admin' || user.role === 'director') && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-accent text-white px-10 py-4 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-accent/20 neo-button"
          >
            + {t.add_group}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {groups.map(group => (
          <div key={group.id} className="glass-card p-10 rounded-[3rem] border border-muted/10 relative group hover:scale-[1.03] transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl pointer-events-none"></div>
            <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-4xl mb-8 shadow-inner group-hover:rotate-12 transition-transform duration-500">🏫</div>
            <h3 className="text-3xl font-black text-textMain mb-3 tracking-tight">{group.name}</h3>
            <p className="text-[10px] text-muted font-black uppercase tracking-[0.3em] opacity-40">{group.department} • {group.course} {t.course}</p>
            
            {(user.role === 'admin' || user.role === 'director') && (
              <button 
                onClick={() => onDelete(group.id, group.name)}
                className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all duration-300 shadow-xl opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 group/del"
                title={t.delete}
              >
                <span className="text-xl group-hover/del:rotate-12 transition-transform">🗑️</span>
              </button>
            )}
          </div>
        ))}
        {groups.length === 0 && <div className="col-span-full py-20 text-center text-muted font-black uppercase tracking-widest opacity-30">{t.no_data}</div>}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="bg-surface w-full max-w-md p-12 rounded-[3.5rem] shadow-2xl border border-muted/10 animate-in zoom-in-95">
            <h3 className="text-3xl font-black text-textMain mb-10 tracking-tighter uppercase">{t.add_group}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-4">Имя группы</label>
                <input 
                  name="name" 
                  required 
                  placeholder="Напр. CS-101" 
                  className="w-full bg-primary/5 border border-muted/10 rounded-2xl px-6 py-4 text-textMain font-bold outline-none focus:border-accent transition-all placeholder:text-textMain/30" 
                />
              </div>
              
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-4">Департамент</label>
                <input 
                  name="department" 
                  required 
                  placeholder="Факультет / Отделение" 
                  className="w-full bg-primary/5 border border-muted/10 rounded-2xl px-6 py-4 text-textMain font-bold outline-none focus:border-accent transition-all placeholder:text-textMain/30" 
                />
              </div>
              
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-4">{t.course}</label>
                <select 
                  name="course" 
                  className="w-full bg-primary/5 border border-muted/10 rounded-2xl px-6 py-4 text-textMain font-bold outline-none focus:border-accent transition-all cursor-pointer appearance-none"
                >
                  {[1, 2, 3, 4].map(c => <option key={c} value={c} className="bg-surface text-textMain">{c} {t.course}</option>)}
                </select>
              </div>
              
              <div className="flex space-x-4 pt-8">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 bg-muted/5 text-textMain/70 hover:text-textMain border border-muted/10 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all">{t.cancel}</button>
                <button type="submit" className="flex-1 bg-accent text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-accent/20 hover:brightness-110 active:scale-95 transition-all">+ {t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
