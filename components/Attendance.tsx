import React, { useState, useMemo, useEffect } from 'react';
import { StorageService } from '../store';
import { translations } from '../translations';
import { User, AttendanceRecord, LangType, ScheduleEntry } from '../types';
import { AudioService } from '../services/audioService';

interface AttendanceProps {
  user: User;
  lang: LangType;
  onToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

const Attendance: React.FC<AttendanceProps> = ({ user, lang, onToast }) => {
  const t = translations[lang];
  const groups = useMemo(() => StorageService.getGroups(), []);
  const allSchedule = useMemo(() => StorageService.getSchedule(), []);
  
  const [selectedGroup, setSelectedGroup] = useState<string>(groups[0]?.name || '');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  
  const dayOfWeek = useMemo(() => {
    const d = new Date(selectedDate).getDay();
    return d === 0 ? 5 : d - 1; // 0 (Monday) to 5 (Saturday) as per our schedule logic
  }, [selectedDate]);

  const groupSchedule = useMemo(() => {
    return allSchedule.filter(s => s.group === selectedGroup && s.day === dayOfWeek);
  }, [allSchedule, selectedGroup, dayOfWeek]);

  useEffect(() => {
    if (groupSchedule.length > 0) {
      setSelectedScheduleId(groupSchedule[0].id);
    } else {
      setSelectedScheduleId('');
    }
  }, [groupSchedule]);

  const activeLesson = useMemo(() => {
    return groupSchedule.find(s => s.id === selectedScheduleId);
  }, [groupSchedule, selectedScheduleId]);

  const allStudents = useMemo(() => StorageService.getUsers().filter(u => u.role === 'student'), []);
  const groupStudents = useMemo(() => allStudents.filter(s => s.group === selectedGroup), [allStudents, selectedGroup]);

  // Load existing attendance if any
  useEffect(() => {
    if (activeLesson && selectedDate) {
      const existing = StorageService.getAttendance().filter(a => 
        a.date === selectedDate && 
        a.subject === activeLesson.subject && 
        groupStudents.some(s => s.id === a.studentId)
      );
      const map: Record<string, 'present' | 'absent' | 'late'> = {};
      existing.forEach(r => map[r.studentId] = r.status);
      setAttendance(map);
    } else {
      setAttendance({});
    }
  }, [activeLesson, selectedDate, groupStudents]);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    AudioService.play('pop');
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = () => {
    if (!selectedGroup || !activeLesson) {
      onToast(lang === 'ru' ? 'Выберите группу и занятие' : 'Select group and lesson', 'error');
      return;
    }
    
    const records: AttendanceRecord[] = groupStudents.map(student => ({
      id: Math.random().toString(36).substr(2, 9),
      studentId: student.id,
      date: selectedDate,
      status: attendance[student.id] || 'present',
      subject: activeLesson.subject,
      teacher: activeLesson.teacher,
      time: activeLesson.time
    }));

    StorageService.saveAttendance(records);
    onToast(lang === 'ru' ? 'Посещаемость успешно сохранена!' : 'Attendance saved!', 'success');
  };

  const statusStyles = {
    present: 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20 scale-105',
    absent: 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20 scale-105',
    late: 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20 scale-105',
    inactive: 'bg-surface border-muted/20 text-muted hover:border-accent hover:text-accent'
  };

  if (user.role === 'student') {
    const myAttendance = StorageService.getAttendance().filter(a => a.studentId === user.id);
    return (
      <div className="glass-card rounded-[3rem] shadow-xl border border-muted/10 overflow-hidden animate-in fade-in duration-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-primary/5">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-muted uppercase tracking-[0.2em]">{t.date}</th>
                <th className="px-8 py-6 text-[10px] font-black text-muted uppercase tracking-[0.2em]">{t.subject}</th>
                <th className="px-8 py-6 text-[10px] font-black text-muted uppercase tracking-[0.2em]">{t.teacher}</th>
                <th className="px-8 py-6 text-[10px] font-black text-muted uppercase tracking-[0.2em]">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/5">
              {myAttendance.map(a => (
                <tr key={a.id} className="hover:bg-primary/[0.02] transition-colors">
                  <td className="px-8 py-6 text-sm font-bold text-textMain">{a.date}</td>
                  <td className="px-8 py-6 text-sm font-bold text-textMain">
                    <div>{a.subject}</div>
                    <div className="text-[10px] opacity-50 uppercase tracking-widest">{a.time}</div>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-textMain">{a.teacher}</td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      a.status === 'present' ? 'bg-emerald-500/10 text-emerald-500' : a.status === 'absent' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'
                    }`}>
                      {t[a.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {myAttendance.length === 0 && (
                <tr><td colSpan={4} className="px-8 py-12 text-center text-muted font-bold uppercase tracking-widest opacity-40">{t.no_data}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-surface p-8 rounded-[3rem] shadow-xl border border-muted/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col space-y-1.5">
          <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-4">{t.date}</label>
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-primary/5 border border-muted/10 rounded-2xl px-6 py-4 text-textMain font-black outline-none focus:border-accent shadow-sm transition-all"
          />
        </div>
        
        <div className="flex flex-col space-y-1.5">
          <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-4">{t.group}</label>
          <select 
            value={selectedGroup} 
            onChange={(e) => { AudioService.play('click'); setSelectedGroup(e.target.value); }}
            className="w-full bg-primary/5 border border-muted/10 rounded-2xl px-6 py-4 text-textMain font-black outline-none focus:border-accent shadow-sm appearance-none"
          >
            {groups.map(g => <option key={g.id} value={g.name} className="bg-surface text-textMain">{g.name}</option>)}
          </select>
        </div>

        <div className="flex flex-col space-y-1.5">
          <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-4">{t.lesson}</label>
          <select 
            value={selectedScheduleId} 
            onChange={(e) => { AudioService.play('click'); setSelectedScheduleId(e.target.value); }}
            className="w-full bg-primary/5 border border-muted/10 rounded-2xl px-6 py-4 text-textMain font-black outline-none focus:border-accent shadow-sm appearance-none"
          >
            {groupSchedule.map(s => (
              <option key={s.id} value={s.id} className="bg-surface text-textMain">{s.time} - {s.subject}</option>
            ))}
            {groupSchedule.length === 0 && <option value="" className="bg-surface text-textMain">{t.no_data}</option>}
          </select>
        </div>
      </div>

      <div className="glass-card rounded-[3.5rem] shadow-xl border border-muted/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-primary/5">
              <tr>
                <th className="px-10 py-8 text-[10px] font-black text-muted uppercase tracking-[0.2em]">{t.full_name}</th>
                <th className="px-10 py-8 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-center">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/5">
              {groupStudents.map(student => (
                <tr key={student.id} className="hover:bg-primary/[0.02] transition-colors group">
                  <td className="px-10 py-6">
                    <div className="flex items-center space-x-4">
                       <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary group-hover:scale-110 transition-transform">{student.fullName.charAt(0)}</div>
                       <span className="font-black text-textMain tracking-tight text-md">{student.fullName}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex justify-center space-x-3">
                      {(['present', 'late', 'absent'] as const).map(status => {
                        const isActive = (attendance[student.id] || 'present') === status;
                        return (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(student.id, status)}
                            className={`px-6 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border-2 ${
                              isActive ? statusStyles[status] : statusStyles.inactive
                            }`}
                          >
                            {t[status]}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
              {groupStudents.length === 0 && (
                <tr><td colSpan={2} className="px-8 py-20 text-center text-muted font-bold uppercase tracking-widest opacity-40">{t.no_data}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {groupStudents.length > 0 && activeLesson && (
        <button 
          onClick={handleSave}
          className="w-full bg-accent text-white font-black py-6 rounded-[2.5rem] shadow-2xl shadow-accent/20 hover:brightness-110 transition-all active:scale-[0.98] uppercase tracking-[0.3em] text-xs glow-effect mt-8"
        >
          {t.save}
        </button>
      )}
    </div>
  );
};

export default Attendance;