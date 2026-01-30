import React, { useMemo, useState } from 'react';
import { translations } from '../translations';
import { User, LangType } from '../types';
import { StorageService } from '../store';
import { AudioService } from '../services/audioService';

interface ProfileProps {
  user: User;
  lang: LangType;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, lang, onLogout }) => {
  const t = translations[lang];
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [isEditingSubjects, setIsEditingSubjects] = useState(false);
  const [newSubject, setNewSubject] = useState('');

  const students = useMemo(() => StorageService.getStudentProfiles(), []);
  const studentData = useMemo(() => students.find(s => s.id === currentUser.id), [students, currentUser.id]);

  const specialty = useMemo(() => {
    if (!currentUser.group) return null;
    const groups = StorageService.getGroups();
    return groups.find(g => g.name === currentUser.group)?.department;
  }, [currentUser.group]);

  const stats = useMemo(() => {
    if (currentUser.role === 'admin' || currentUser.role === 'director') {
      return [
        { label: lang === 'ru' ? 'Групп' : 'Groups', value: StorageService.getGroups().length, icon: '🏫', color: 'bg-blue-500' },
        { label: lang === 'ru' ? 'Студентов' : 'Students', value: StorageService.getUsers().filter(u => u.role === 'student').length, icon: '👥', color: 'bg-emerald-500' },
        { label: lang === 'ru' ? 'Книг' : 'Books', value: StorageService.getLibrary().length, icon: '📚', color: 'bg-purple-500' },
        { label: lang === 'ru' ? 'Новостей' : 'News', value: StorageService.getNews().length, icon: '📰', color: 'bg-pink-500' },
      ];
    }
    if (studentData) {
      return [
        { label: t.attendance, value: `${Math.round((studentData.attendance.filter(a => a.status === 'present').length / (studentData.attendance.length || 1)) * 100)}%`, icon: '📅', color: 'bg-emerald-500' },
        { label: t.ratings, value: Math.round(studentData.rating), icon: '📊', color: 'bg-blue-500' },
      ];
    }
    return [];
  }, [currentUser, studentData, lang, t.attendance, t.ratings]);

  const handleAddSubject = () => {
    if (!newSubject.trim()) return;
    const updatedSubjects = [...(currentUser.subjects || []), newSubject.trim()];
    const uniqueSubjects = Array.from(new Set(updatedSubjects));
    const updatedUser = { ...currentUser, subjects: uniqueSubjects };
    StorageService.updateUser(updatedUser);
    setCurrentUser(updatedUser);
    setNewSubject('');
    AudioService.play('success');
  };

  const handleRemoveSubject = (subj: string) => {
    const updatedSubjects = (currentUser.subjects || []).filter(s => s !== subj);
    const updatedUser = { ...currentUser, subjects: updatedSubjects };
    StorageService.updateUser(updatedUser);
    setCurrentUser(updatedUser);
    AudioService.play('warning');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 relative">
      <div className="absolute top-0 -left-10 w-64 h-64 bg-primary/10 blur-[100px] pointer-events-none rounded-full"></div>
      <div className="absolute bottom-0 -right-10 w-72 h-72 bg-accent/10 blur-[120px] pointer-events-none rounded-full"></div>

      <section className="flex flex-col items-center relative z-10">
        <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.5em] mb-8 opacity-60">EduControl Digital ID v4.0</h3>
        
        <div 
          onClick={() => AudioService.play('pop')}
          className="relative w-full max-w-sm h-64 bg-gradient-to-br from-[#1e272e] via-[#2f3640] to-[#1e272e] rounded-[3rem] shadow-2xl overflow-hidden group cursor-pointer hover:scale-[1.03] transition-all duration-500 border border-white/10"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          
          <div className="relative h-full p-10 flex flex-col justify-between text-white z-10">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-40">Blockchain Verified</p>
                <h4 className="text-xl font-black tracking-tighter">DIGITAL HUB</h4>
              </div>
              <div className="px-4 py-1.5 bg-accent/20 backdrop-blur-xl rounded-2xl flex items-center space-x-2 border border-accent/30 shadow-lg shadow-accent/10">
                <span className="text-sm animate-pulse">🔥</span>
                <span className="text-[10px] font-black uppercase tracking-widest">{currentUser.streakCount || 1} {t.streak_days}</span>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl overflow-hidden font-black group-hover:rotate-6 transition-transform">
                {currentUser.fullName.charAt(0)}
              </div>
              <div>
                <p className="text-lg font-black tracking-tight leading-none mb-1">{currentUser.fullName}</p>
                <p className="text-[9px] opacity-60 font-black uppercase tracking-[0.2em] text-accent">{currentUser.group || 'College Authority'}</p>
                <div className="mt-3 flex space-x-1.5">
                   {[1,2,3,4,5,6,7].map(i => (
                     <div key={i} className={`w-5 h-1 rounded-full ${i <= (currentUser.streakCount || 1) % 8 ? 'bg-accent shadow-[0_0_8px_var(--accent)]' : 'bg-white/10'}`}></div>
                   ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end pt-4">
               <div className="text-[8px] opacity-20 font-mono tracking-widest uppercase">
                 USER_TOKEN: {currentUser.id.toUpperCase()}
               </div>
               <div className="flex items-center text-[9px] font-black space-x-2 bg-black/30 px-4 py-2 rounded-xl border border-white/5">
                 <span className="w-2 h-2 bg-accent rounded-full animate-ping"></span>
                 <span className="tracking-widest uppercase opacity-70">Secured</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      <div className="glass-card rounded-[4xl] overflow-hidden shadow-2xl border border-white/10 relative z-10">
        <div className="h-44 bg-gradient-to-r from-primary/20 via-accent/10 to-secondary/20 flex items-center px-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            <div className="w-full flex justify-end opacity-5 text-8xl font-black tracking-tighter uppercase select-none">
                {currentUser.role}
            </div>
        </div>

        <div className="px-12 pb-12">
          <div className="relative flex justify-between items-end -mt-20 mb-10">
            <div className="w-40 h-40 rounded-[3rem] bg-surface p-2 shadow-2xl border border-muted/5">
              <div className="w-full h-full rounded-[2.5rem] bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-6xl font-black shadow-xl">
                {currentUser.fullName.charAt(0)}
              </div>
            </div>
            <div className="flex space-x-4 mb-4">
              <button 
                onClick={onLogout}
                className="bg-accent text-white px-8 py-4 rounded-2xl font-black hover:scale-105 transition-all shadow-xl shadow-accent/20 active:scale-95 flex items-center space-x-3 uppercase tracking-widest text-xs"
              >
                <span>🚪</span>
                <span>{t.logout}</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-black text-textMain tracking-tighter">
              {currentUser.fullName}
              <span className="ml-3 text-accent text-2xl">✓</span>
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20">{t[currentUser.role]}</span>
              {currentUser.group && (
                <span className="bg-accent/10 text-accent px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-accent/20">{currentUser.group}</span>
              )}
              {currentUser.course && (
                <span className="bg-secondary/10 text-secondary px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-secondary/20">{currentUser.course} {t.course}</span>
              )}
              {specialty && (
                <span className="bg-orange-500/10 text-orange-500 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-orange-500/20">{specialty}</span>
              )}
              <span className="text-sm font-medium tracking-tight italic opacity-40">{currentUser.email}</span>
            </div>
          </div>

          {/* Teacher Subjects Management */}
          {currentUser.role === 'teacher' && (
            <div className="mt-14 p-8 bg-primary/5 rounded-4xl border border-primary/10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black text-primary uppercase tracking-[0.4em]">
                  {lang === 'en' ? 'Expertise & Subjects' : 'Предметы преподавания'}
                </h3>
                <button 
                  onClick={() => setIsEditingSubjects(!isEditingSubjects)}
                  className="text-[10px] font-black text-accent uppercase tracking-widest border-b-2 border-accent/20 hover:border-accent transition-all"
                >
                  {isEditingSubjects ? t.save : t.edit}
                </button>
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                {(currentUser.subjects || []).map(subj => (
                  <span key={subj} className="bg-transparent text-textMain px-5 py-2.5 rounded-2xl text-xs font-bold border border-textMain/40 shadow-sm flex items-center group hover:border-accent transition-colors">
                    {subj}
                    {isEditingSubjects && (
                      <button 
                        onClick={() => handleRemoveSubject(subj)}
                        className="ml-3 text-red-500 opacity-40 hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                ))}
                {(currentUser.subjects || []).length === 0 && (
                  <p className="text-muted text-xs font-bold italic opacity-40 uppercase tracking-widest">{t.no_data}</p>
                )}
              </div>

              {isEditingSubjects && (
                <div className="flex gap-3 animate-in slide-in-from-top-2 duration-300">
                  <input 
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder={lang === 'en' ? 'Add new subject...' : 'Добавить новый предмет...'}
                    className="flex-1 bg-surface dark:bg-gray-900 border border-muted/10 rounded-2xl px-6 py-4 text-sm text-textMain outline-none focus:border-accent"
                  />
                  <button 
                    onClick={handleAddSubject}
                    className="bg-accent text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-accent/10 active:scale-95 transition-all"
                  >
                    + {lang === 'en' ? 'Add' : 'Добавить'}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className={`grid grid-cols-2 ${stats.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-6 mt-14`}>
            {stats.map((stat, i) => (
              <div key={i} className="glass-card p-8 rounded-4xl border border-white/10 hover:border-accent/30 transition-all duration-500 group cursor-default relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-16 h-16 ${stat.color} opacity-10 blur-2xl`}></div>
                <div className="text-3xl mb-4 transition-transform group-hover:scale-125 duration-500">{stat.icon}</div>
                <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mb-2 opacity-50">{stat.label}</p>
                <p className="text-2xl font-black text-textMain tracking-tighter">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;