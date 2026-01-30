
import React, { useState, useMemo, useEffect } from 'react';
import { StorageService } from '../store';
import { User, Role, LangType, ThemeName } from '../types';
import { translations } from '../translations';
import { AudioService } from '../services/audioService';

interface AuthProps {
  onLogin: (user: User) => void;
  lang: LangType;
  setLang: (l: LangType) => void;
  theme: ThemeName;
  changeTheme: (t: ThemeName) => void;
}

const ADMIN_REGISTRATION_KEY = "ADMIN123";

const Auth: React.FC<AuthProps> = ({ onLogin, lang, setLang, theme, changeTheme }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('student');
  
  const allGroups = useMemo(() => StorageService.getGroups(), []);
  const allAvailableSubjects = useMemo(() => StorageService.getAllAvailableSubjects(), [isLogin]);
  
  const [selectedCourse, setSelectedCourse] = useState<number>(1);
  const [group, setGroup] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  
  const filteredGroups = useMemo(() => {
    return allGroups.filter(g => g.course === selectedCourse);
  }, [allGroups, selectedCourse]);

  const filteredSubjects = useMemo(() => {
    return allAvailableSubjects.filter(s => 
      s.toLowerCase().includes(subjectSearch.toLowerCase()) && !selectedSubjects.includes(s)
    ).slice(0, 6);
  }, [allAvailableSubjects, subjectSearch, selectedSubjects]);

  useEffect(() => {
    if (filteredGroups.length > 0) {
      setGroup(filteredGroups[0].name);
    } else {
      setGroup('');
    }
  }, [filteredGroups]);
  
  const [secretKey, setSecretKey] = useState('');
  const t = translations[lang];

  const toggleSubject = (subject: string) => {
    AudioService.play('pop');
    setSelectedSubjects(prev => 
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const handleAddCustomSubject = () => {
    if (!customSubject.trim()) return;
    if (selectedSubjects.includes(customSubject.trim())) {
      setCustomSubject('');
      return;
    }
    toggleSubject(customSubject.trim());
    setCustomSubject('');
  };

  const handleDemoLogin = (type: 'admin' | 'student') => {
    const users = StorageService.getUsers();
    let demoUser = users.find(u => u.role === type && u.email.includes('demo'));
    
    if (!demoUser) {
      demoUser = {
        id: Math.random().toString(36).substr(2, 9),
        fullName: type === 'admin' ? (lang === 'en' ? 'Demo Admin' : 'Демо Админ') : (lang === 'en' ? 'Demo Student' : 'Демо Студент'),
        email: `${type}@demo.edu`,
        role: type,
        group: type === 'student' ? 'CS-101' : undefined,
        course: type === 'student' ? 1 : undefined,
        registeredAt: Date.now()
      };
      StorageService.addUser(demoUser);
    }
    onLogin(demoUser);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const users = StorageService.getUsers();
    
    if (isLogin) {
      const user = users.find(u => u.email === email);
      if (user) {
        onLogin(user);
      } else {
        alert(lang === 'ru' ? 'Пользователь не найден.' : (lang === 'ky' ? 'Колдонуучу табылган жок.' : 'User not found.'));
      }
    } else {
      if ((role === 'admin' || role === 'director') && secretKey !== ADMIN_REGISTRATION_KEY) {
        alert(t.invalid_key);
        return;
      }

      if (role === 'student' && !group) {
        alert(lang === 'ru' ? 'Пожалуйста, выберите группу.' : 'Please select a group.');
        return;
      }

      if (role === 'teacher' && selectedSubjects.length === 0) {
        alert(lang === 'ru' ? 'Пожалуйста, выберите хотя бы один предмет.' : 'Please select at least one subject.');
        return;
      }

      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        fullName,
        email,
        role,
        group: role === 'student' ? group : undefined,
        course: role === 'student' ? selectedCourse : undefined,
        subjects: role === 'teacher' ? selectedSubjects : undefined,
        registeredAt: Date.now()
      };
      StorageService.addUser(newUser);
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background">
      <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/10 blur-[140px] rounded-full animate-blob"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-accent/5 blur-[160px] rounded-full animate-blob animation-delay-2000"></div>
      </div>

      <div className="absolute top-8 right-8 flex space-x-4 z-30">
         <div className="bg-surface/50 backdrop-blur-2xl rounded-2xl p-1 border border-muted/20 flex shadow-2xl">
            {(['ru', 'ky', 'en'] as const).map(l => (
                <button 
                  key={l}
                  onClick={() => setLang(l)} 
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${lang === l ? 'bg-accent text-white shadow-lg' : 'text-textMain/40 hover:text-textMain'}`}
                >
                    {l}
                </button>
            ))}
         </div>
      </div>

      <div className="w-full max-w-lg space-y-8 animate-in zoom-in-95 duration-1000 relative z-10">
        <div className="bg-surface backdrop-blur-[60px] p-10 md:p-14 rounded-[4rem] shadow-[0_32px_64px_rgba(0,0,0,0.1)] border border-muted/10 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
          
          <div className="text-center mb-12 relative">
            <div className="w-24 h-24 bg-gradient-to-br from-primary via-blue-500 to-accent rounded-[2.5rem] mx-auto flex items-center justify-center text-white text-5xl font-black mb-8 rotate-6 shadow-xl glow-effect">E</div>
            <h1 className="text-5xl font-black text-textMain mb-2 tracking-tighter leading-none">EduControl</h1>
            <p className="text-accent font-black tracking-[0.5em] text-[10px] uppercase opacity-90">{isLogin ? t.login : t.register}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="relative">
                <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} 
                className="w-full bg-primary/5 border border-muted/20 rounded-2xl px-7 py-5 text-textMain outline-none focus:border-accent focus:bg-primary/10 transition-all placeholder:text-textMain/40 text-sm font-bold shadow-inner" 
                placeholder={t.full_name} />
              </div>
            )}
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} 
            className="w-full bg-primary/5 border border-muted/20 rounded-2xl px-7 py-5 text-textMain outline-none focus:border-accent focus:bg-primary/10 transition-all placeholder:text-textMain/40 text-sm font-bold shadow-inner" 
            placeholder="Email Address" />
            
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} 
            className="w-full bg-primary/5 border border-muted/20 rounded-2xl px-7 py-5 text-textMain outline-none focus:border-accent focus:bg-primary/10 transition-all placeholder:text-textMain/40 text-sm font-bold shadow-inner" 
            placeholder="Password" />

            {!isLogin && (
              <div className="space-y-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-4">{lang === 'en' ? 'Select Role' : 'Выберите роль'}</label>
                  <select value={role} onChange={(e) => setRole(e.target.value as Role)} 
                  className="bg-primary/5 border border-muted/20 rounded-2xl px-5 py-5 text-textMain outline-none font-black text-[10px] uppercase tracking-widest focus:border-accent transition-all cursor-pointer">
                    <option value="student">{t.student}</option>
                    <option value="teacher">{t.teacher}</option>
                    <option value="admin">{t.admin}</option>
                  </select>
                </div>

                {role === 'student' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-4">{t.course}</label>
                      <select value={selectedCourse} onChange={(e) => setSelectedCourse(parseInt(e.target.value))} 
                      className="bg-primary/5 border border-muted/20 rounded-2xl px-5 py-5 text-textMain outline-none font-black text-[10px] uppercase tracking-widest focus:border-accent transition-all cursor-pointer">
                        {[1, 2, 3, 4].map(c => <option key={c} value={c}>{c} {t.course}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-4">{t.group}</label>
                      <select value={group} onChange={(e) => setGroup(e.target.value)} 
                      className="bg-primary/5 border border-muted/20 rounded-2xl px-5 py-5 text-textMain outline-none font-black text-[10px] uppercase tracking-widest focus:border-accent transition-all cursor-pointer">
                        {filteredGroups.length > 0 ? (
                          filteredGroups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)
                        ) : (
                          <option value="" disabled>{t.no_data}</option>
                        )}
                      </select>
                    </div>
                  </div>
                )}

                {role === 'teacher' && (
                  <div className="flex flex-col space-y-3 bg-primary/5 p-6 rounded-3xl border border-muted/10">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2">
                      {lang === 'en' ? 'Subjects Taught' : 'Предметы преподавания'}
                    </label>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                       {selectedSubjects.map(s => (
                         <span key={s} className="bg-accent text-white text-[9px] font-black px-3 py-1.5 rounded-xl flex items-center shadow-lg animate-in zoom-in-95">
                           {s}
                           <button type="button" onClick={() => toggleSubject(s)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">✕</button>
                         </span>
                       ))}
                    </div>

                    <div className="relative">
                      <input 
                        type="text" 
                        value={subjectSearch}
                        onChange={(e) => setSubjectSearch(e.target.value)}
                        placeholder={lang === 'en' ? "Search or add subject..." : "Поиск или новый предмет..."}
                        className="w-full bg-surface border border-muted/10 rounded-xl px-4 py-3 text-xs text-textMain placeholder:text-textMain/40 outline-none focus:border-accent/50 transition-all shadow-sm font-black"
                      />
                      {subjectSearch && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-surface border border-muted/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                           {filteredSubjects.map(s => (
                             <button 
                               key={s} 
                               type="button"
                               onClick={() => { toggleSubject(s); setSubjectSearch(''); }}
                               className="w-full text-left px-4 py-3 text-[10px] font-black uppercase text-textMain hover:bg-accent hover:text-white transition-all border-b border-muted/5 last:border-0"
                             >
                               + {s}
                             </button>
                           ))}
                           <div className="p-3 bg-muted/5 flex gap-2">
                              <input 
                                value={customSubject}
                                onChange={(e) => setCustomSubject(e.target.value)}
                                placeholder="..."
                                className="flex-1 bg-surface border border-muted/10 rounded-lg px-3 py-2 text-[10px] text-textMain outline-none focus:border-accent/30 font-black"
                              />
                              <button 
                                type="button"
                                onClick={handleAddCustomSubject}
                                className="bg-accent text-white px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
                              >
                                {lang === 'en' ? 'Create' : 'Создать'}
                              </button>
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isLogin && (role === 'admin') && (
              <input required type="password" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} 
              className="w-full bg-accent/5 border border-accent/20 rounded-2xl px-7 py-5 text-accent outline-none placeholder:text-accent/30 text-sm font-black shadow-inner" 
              placeholder={t.admin_key} />
            )}

            <button type="submit" className="w-full bg-accent text-white font-black py-5 rounded-2xl shadow-2xl shadow-accent/40 hover:scale-[1.02] transition-all uppercase tracking-[0.3em] text-xs active:scale-95 mt-6 glow-effect">
              {isLogin ? t.login : t.register}
            </button>
          </form>

          <p className="text-center text-xs text-muted mt-10 font-bold uppercase tracking-widest">
            {isLogin ? (lang === 'en' ? "New here?" : "Новичок в системе?") : (lang === 'en' ? "Have an account?" : "Уже зарегистрированы?")}
            <button onClick={() => setIsLogin(!isLogin)} className="ml-3 text-accent font-black hover:text-textMain transition-colors border-b-2 border-accent/20 hover:border-accent">
              {isLogin ? t.register : t.login}
            </button>
          </p>
        </div>

        <div className="bg-surface/50 backdrop-blur-xl p-8 rounded-[3rem] border border-muted/10 shadow-2xl flex flex-col items-center">
           <h3 className="text-[9px] font-black text-muted/40 uppercase tracking-[0.4em] mb-6">Quick Demo Entrance</h3>
           <div className="grid grid-cols-2 gap-4 w-full">
             <button onClick={() => handleDemoLogin('student')} className="py-4 bg-primary/5 hover:bg-primary/10 text-textMain/70 hover:text-textMain rounded-2xl text-[10px] font-black uppercase tracking-widest border border-muted/10 transition-all shadow-sm">
               👨‍🎓 {lang === 'en' ? 'Student' : 'Студент'}
             </button>
             <button onClick={() => handleDemoLogin('admin')} className="py-4 bg-primary/5 hover:bg-primary/10 text-textMain/70 hover:text-textMain rounded-2xl text-[10px] font-black uppercase tracking-widest border border-muted/10 transition-all shadow-sm">
               🛡️ {lang === 'en' ? 'Admin' : 'Админ'}
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
