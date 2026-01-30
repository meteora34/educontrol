
import React, { useState, useMemo } from 'react';
import { StorageService } from '../store';
import { translations } from '../translations';
import { User, ScheduleEntry, LangType } from '../types';
import { AudioService } from '../services/audioService';

interface ScheduleProps {
  schedule: ScheduleEntry[];
  user: User;
  lang: LangType;
  onRefresh: () => void;
  onDelete: (id: string, title: string) => void;
  onToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

const Schedule: React.FC<ScheduleProps> = ({ schedule, user, lang, onRefresh, onDelete, onToast }) => {
  const t = translations[lang];
  const groups = StorageService.getGroups();
  
  // States for navigation
  const [selectedGroup, setSelectedGroup] = useState<string>(user.group || groups[0]?.name || '');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // 0 = current week, 1 = next week, etc.
  const [isAdding, setIsAdding] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);

  // Date Calculation logic
  const weekDates = useMemo(() => {
    const now = new Date();
    const day = now.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = now.getDate() - (day === 0 ? 6 : day - 1) + (currentWeekOffset * 7);
    const monday = new Date(now.setDate(diff));
    
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [currentWeekOffset]);

  const dateRangeString = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[5];
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${start.toLocaleDateString(lang, options)} — ${end.toLocaleDateString(lang, options)}`;
  }, [weekDates, lang]);

  const filteredSchedule = useMemo(() => 
    schedule.filter(s => s.group === selectedGroup), 
    [schedule, selectedGroup]
  );

  const isAdmin = user.role === 'admin' || user.role === 'teacher';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const entryData = {
      subject: formData.get('subject') as string,
      teacher: formData.get('teacher') as string,
      room: formData.get('room') as string,
      day: parseInt(formData.get('day') as string),
      time: formData.get('time') as string,
      group: selectedGroup,
    };

    if (editingEntry) {
      StorageService.updateScheduleEntry({ ...editingEntry, ...entryData });
    } else {
      StorageService.addScheduleEntry({
        id: Math.random().toString(36).substr(2, 9),
        ...entryData
      });
    }
    onToast(lang === 'ru' ? 'Расписание успешно сохранено!' : 'Schedule saved!', 'success');
    setIsAdding(false);
    setEditingEntry(null);
    onRefresh();
  };

  const handleWeekChange = (offset: number) => {
    AudioService.play('click');
    setCurrentWeekOffset(prev => prev + offset);
  };

  const resetToToday = () => {
    AudioService.play('pop');
    setCurrentWeekOffset(0);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Top Navigation Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-6 bg-surface/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-muted/10 shadow-xl">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-64">
             <select 
              value={selectedGroup}
              onChange={(e) => { AudioService.play('click'); setSelectedGroup(e.target.value); }}
              className="w-full bg-primary/5 border border-muted/10 rounded-2xl px-6 py-4 text-textMain outline-none shadow-sm font-black appearance-none focus:border-accent transition-all"
            >
              {groups.map(g => <option key={g.id} value={g.name} className="bg-surface text-textMain">{g.name}</option>)}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">▼</div>
          </div>

          <div className="flex items-center bg-black/20 p-1.5 rounded-2xl border border-white/5 shadow-inner">
             <button 
               onClick={() => handleWeekChange(-1)}
               className="p-3 hover:bg-white/10 rounded-xl transition-all text-accent"
               title="Предыдущая неделя"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
             </button>
             
             <div className="px-6 text-center min-w-[160px]">
                <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-0.5 opacity-60">
                   {currentWeekOffset === 0 ? (lang === 'ru' ? 'Текущая неделя' : 'Current Week') : (lang === 'ru' ? `Смещение: ${currentWeekOffset} нед.` : `Offset: ${currentWeekOffset} wks`)}
                </p>
                <p className="text-xs font-black text-textMain tracking-tight">{dateRangeString}</p>
             </div>

             <button 
               onClick={() => handleWeekChange(1)}
               className="p-3 hover:bg-white/10 rounded-xl transition-all text-accent"
               title="Следующая неделя"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
             </button>
          </div>

          <button 
            onClick={resetToToday}
            className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${currentWeekOffset === 0 ? 'bg-primary/10 text-primary opacity-40 cursor-default' : 'bg-primary text-white shadow-lg hover:brightness-110 active:scale-95'}`}
          >
            {lang === 'ru' ? 'Сегодня' : 'Today'}
          </button>
        </div>

        {isAdmin && (
          <button 
            onClick={() => { AudioService.play('pop'); setIsAdding(true); }}
            className="bg-accent text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-accent/20 neo-button active:scale-95 transition-all"
          >
            + {t.add_lesson}
          </button>
        )}
      </div>

      {/* Grid Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {weekDates.map((date, dayIndex) => {
          const dayLessons = filteredSchedule.filter(s => s.day === dayIndex).sort((a,b) => a.time.localeCompare(b.time));
          const isToday = new Date().toDateString() === date.toDateString();
          
          return (
            <div key={dayIndex} className={`glass-card rounded-[2.5rem] p-6 border transition-all duration-500 flex flex-col h-full ${isToday ? 'border-accent/40 ring-4 ring-accent/5 shadow-2xl scale-[1.02]' : 'border-muted/10 shadow-sm hover:border-primary/20'}`}>
              <div className="mb-6 flex justify-between items-start">
                <div>
                  <h3 className={`text-xs font-black uppercase tracking-widest ${isToday ? 'text-accent' : 'text-primary'}`}>
                    {t.days[dayIndex]}
                  </h3>
                  <p className="text-[10px] font-bold text-muted mt-1 opacity-60">
                    {date.toLocaleDateString(lang, { day: '2-digit', month: '2-digit' })}
                  </p>
                </div>
                {isToday && <span className="w-2 h-2 bg-accent rounded-full animate-ping"></span>}
              </div>

              <div className="space-y-4 flex-1">
                {dayLessons.map(lesson => (
                  <div key={lesson.id} className="group relative p-4 bg-primary/5 rounded-[1.5rem] border border-transparent hover:border-primary/20 hover:bg-primary/[0.08] transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] font-black text-primary uppercase tracking-widest">{lesson.time}</span>
                      {isAdmin && (
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setEditingEntry(lesson); setIsAdding(true); AudioService.play('click'); }} 
                            className="w-7 h-7 flex items-center justify-center bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                          </button>
                          <button 
                            onClick={() => onDelete(lesson.id, lesson.subject)} 
                            className="w-7 h-7 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                      )}
                    </div>
                    <h4 className="font-black text-textMain text-xs leading-tight mb-1">{lesson.subject}</h4>
                    <p className="text-[9px] text-muted font-bold uppercase tracking-widest opacity-50 truncate">{lesson.teacher}</p>
                    <div className="mt-3">
                      <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter">
                         № {lesson.room}
                      </span>
                    </div>
                  </div>
                ))}
                {dayLessons.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 opacity-20 group">
                    <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">☕</span>
                    <p className="text-[9px] text-muted font-black uppercase tracking-widest">{t.no_data}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {(isAdding || editingEntry) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-surface dark:bg-[#161642] rounded-[3.5rem] p-12 w-full max-w-md shadow-2xl border border-white/10 animate-in zoom-in-95 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-secondary"></div>
            
            <h3 className="text-3xl font-black text-textMain mb-10 tracking-tighter uppercase">{editingEntry ? t.edit : t.add_lesson}</h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-4">{t.subject}</label>
                <input 
                  name="subject" 
                  defaultValue={editingEntry?.subject} 
                  required 
                  className="w-full bg-primary/5 border border-muted/10 rounded-2xl px-6 py-4 text-textMain font-black outline-none focus:border-accent transition-all shadow-inner" 
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-4">{t.teacher}</label>
                <input 
                  name="teacher" 
                  defaultValue={editingEntry?.teacher} 
                  required 
                  className="w-full bg-primary/5 border border-muted/10 rounded-2xl px-6 py-4 text-textMain font-black outline-none focus:border-accent transition-all shadow-inner" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-4">{t.room}</label>
                  <input 
                    name="room" 
                    defaultValue={editingEntry?.room} 
                    required 
                    className="w-full bg-primary/5 border border-muted/10 rounded-2xl px-6 py-4 text-textMain font-black outline-none focus:border-accent transition-all shadow-inner" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-4">{t.time}</label>
                  <input 
                    name="time" 
                    defaultValue={editingEntry?.time} 
                    required 
                    placeholder="08:30 - 10:00" 
                    className="w-full bg-primary/5 border border-muted/10 rounded-2xl px-6 py-4 text-textMain font-black outline-none focus:border-accent transition-all shadow-inner" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-4">{lang === 'ru' ? 'День недели' : 'Day of week'}</label>
                <select 
                  name="day" 
                  defaultValue={editingEntry?.day || 0} 
                  className="w-full bg-primary/5 border border-muted/10 rounded-2xl px-6 py-4 text-textMain font-black outline-none focus:border-accent transition-all cursor-pointer appearance-none shadow-inner"
                >
                  {t.days.map((d, i) => <option key={i} value={i} className="bg-surface text-textMain">{d}</option>)}
                </select>
              </div>

              <div className="flex space-x-4 pt-8">
                <button 
                  type="button" 
                  onClick={() => { AudioService.play('click'); setIsAdding(false); setEditingEntry(null); }} 
                  className="flex-1 py-5 bg-black/40 text-white/70 hover:text-white border border-white/5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-accent text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-accent/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
