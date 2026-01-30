import React, { useMemo, useState, useEffect } from 'react';
import { StorageService } from '../store';
import { translations } from '../translations';
import { User, StudentProfile, LangType, AttendanceRecord } from '../types';
import { AudioService } from '../services/audioService';

interface RatingsProps {
  lang: LangType;
  currentUser: User;
}

const Ratings: React.FC<RatingsProps> = ({ lang, currentUser }) => {
  const t = translations[lang];
  const groups = useMemo(() => StorageService.getGroups(), []);
  
  const [selectedCourse, setSelectedCourse] = useState<number | 'all'>(() => {
    const saved = localStorage.getItem('edu_filter_course');
    return saved ? (saved === 'all' ? 'all' : parseInt(saved)) : 'all';
  });
  
  const [selectedGroup, setSelectedGroup] = useState<string>(() => {
    return localStorage.getItem('edu_filter_group') || 'all';
  });

  const [studentList, setStudentList] = useState<StudentProfile[]>([]);
  const [filterAttendance, setFilterAttendance] = useState<'all' | 'high' | 'low'>('all');

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'teacher' || currentUser.role === 'director';

  const fetchData = () => {
    const profiles = StorageService.getStudentProfiles();
    setStudentList(profiles);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredStudents = useMemo(() => {
    return studentList.filter(s => {
      const studentCourse = s.course || groups.find(g => g.name === s.group)?.course;
      const courseMatch = selectedCourse === 'all' || studentCourse === selectedCourse;
      const groupMatch = selectedGroup === 'all' || s.group === selectedGroup;
      
      const attRate = s.attendance.length ? (s.attendance.filter(a => a.status === 'present').length / s.attendance.length) * 100 : 100;
      let attendanceMatch = true;
      if (filterAttendance === 'high') attendanceMatch = attRate >= 80;
      if (filterAttendance === 'low') attendanceMatch = attRate < 50;

      return courseMatch && groupMatch && attendanceMatch;
    }).sort((a, b) => b.rating - a.rating);
  }, [studentList, selectedCourse, selectedGroup, groups, filterAttendance]);

  const availableGroups = useMemo(() => {
    if (selectedCourse === 'all') return groups;
    return groups.filter(g => g.course === selectedCourse);
  }, [selectedCourse, groups]);

  const handleScoreChange = (studentId: string, value: string) => {
    let score = parseInt(value) || 0;
    if (score > 100) score = 100;
    if (score < 0) score = 0;
    
    StorageService.saveStudentScore(studentId, score);
    fetchData();
    AudioService.play('pop');
  };

  const getAttendanceStats = (records: AttendanceRecord[]) => {
    if (!records.length) return { rate: 100, present: 0, absent: 0, late: 0 };
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const points = present + (late * 0.5);
    const rate = Math.round((points / records.length) * 100);
    return { rate, present, absent, late };
  };

  const getGrade = (score: number) => {
    if (score >= 87) return 5;
    if (score >= 74) return 4;
    if (score >= 60) return 3;
    if (score >= 40) return 2;
    return 1;
  };

  const getGradeColor = (grade: number) => {
    switch (grade) {
      case 5: return 'bg-emerald-500 text-white shadow-emerald-500/20';
      case 4: return 'bg-blue-500 text-white shadow-blue-500/20';
      case 3: return 'bg-yellow-500 text-white shadow-yellow-500/20';
      case 2: return 'bg-orange-500 text-white shadow-orange-500/20';
      default: return 'bg-red-500 text-white shadow-red-500/20';
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 bg-surface p-8 rounded-[3rem] shadow-xl border border-muted/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl"></div>
        <div className="flex-shrink-0 relative">
          <h2 className="text-3xl font-black text-primary tracking-tighter uppercase leading-none mb-2">{t.leaderboard}</h2>
          <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-60">Formula: 80% Academics + 20% Attendance</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          <div className="flex flex-col space-y-1.5">
            <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-4">{t.course}</label>
            <select 
              value={selectedCourse}
              onChange={(e) => { 
                const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
                setSelectedCourse(val); 
                setSelectedGroup('all'); 
                AudioService.play('click'); 
              }}
              className="bg-primary/5 border border-muted/10 rounded-2xl px-6 py-3 text-textMain font-black outline-none focus:border-accent transition-all shadow-sm min-w-[140px] appearance-none"
            >
              <option value="all" className="bg-surface text-textMain">{t.all_courses}</option>
              {[1, 2, 3, 4].map(c => <option key={c} value={c} className="bg-surface text-textMain">{c} {t.course}</option>)}
            </select>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-4">{t.group}</label>
            <select 
              value={selectedGroup}
              onChange={(e) => { setSelectedGroup(e.target.value); AudioService.play('click'); }}
              className="bg-primary/5 border border-muted/10 rounded-2xl px-6 py-3 text-textMain font-black outline-none focus:border-accent transition-all shadow-sm min-w-[180px] appearance-none"
            >
              <option value="all" className="bg-surface text-textMain">{t.all_groups}</option>
              {availableGroups.map(g => <option key={g.id} value={g.name} className="bg-surface text-textMain">{g.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-[3.5rem] overflow-hidden border border-muted/10 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-primary/5">
              <tr>
                <th className="px-8 py-8 text-[10px] font-black text-muted uppercase tracking-[0.2em]">{t.rating_pos}</th>
                <th className="px-8 py-8 text-[10px] font-black text-muted uppercase tracking-[0.2em]">{t.full_name}</th>
                <th className="px-8 py-8 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-center">{t.attendance} (20%)</th>
                <th className="px-8 py-8 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-center">{t.performance} (80%)</th>
                <th className="px-8 py-8 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-center">{t.ratings}</th>
                <th className="px-8 py-8 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-center">{t.grade}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/5">
              {filteredStudents.map((student, index) => {
                const grade = getGrade(student.rating);
                const att = getAttendanceStats(student.attendance);
                
                return (
                  <tr key={student.id} className={`hover:bg-primary/[0.02] transition-colors ${currentUser.id === student.id ? 'bg-accent/5' : ''} group`}>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center justify-center w-12 h-12 rounded-[1.2rem] font-black text-md transition-all group-hover:rotate-6 ${
                        index < 3 ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'bg-surface border border-muted/10 text-textMain opacity-70'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-primary to-accent flex items-center justify-center font-black text-white text-lg shadow-inner">
                          {student.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-textMain tracking-tight leading-none mb-1 text-md">{student.fullName}</p>
                          <p className="text-[10px] font-black text-muted uppercase tracking-widest opacity-60">{student.group}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-md font-black tracking-tighter ${att.rate >= 80 ? 'text-emerald-500' : att.rate < 50 ? 'text-red-500' : 'text-textMain'}`}>
                          {att.rate}%
                        </span>
                        <div className="flex space-x-0.5 mt-2">
                           {student.attendance.slice(-8).map((a, i) => (
                             <div 
                               key={i} 
                               className={`w-1.5 h-1.5 rounded-full ${
                                 a.status === 'present' ? 'bg-emerald-500' : a.status === 'late' ? 'bg-orange-500' : 'bg-red-500'
                               }`}
                             ></div>
                           ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       {isAdmin ? (
                         <input 
                           type="number" 
                           defaultValue={student.academicScore || 0}
                           onBlur={(e) => handleScoreChange(student.id, e.target.value)}
                           className="w-20 bg-primary/5 border border-muted/10 rounded-xl px-2 py-2 text-center text-md font-black text-textMain outline-none focus:border-accent"
                         />
                       ) : (
                         <span className="text-md font-black text-textMain tracking-tighter">{student.academicScore || 0}</span>
                       )}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="relative inline-block">
                        <span className="text-2xl font-black text-accent tracking-tighter glow-text">
                          {student.rating}
                        </span>
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`inline-flex items-center justify-center w-12 h-12 rounded-[1.2rem] text-xl font-black shadow-lg transition-transform group-hover:scale-110 ${getGradeColor(grade)}`}>
                        {grade}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center opacity-30 grayscale">
                       <span className="text-6xl mb-4">🧊</span>
                       <p className="text-muted font-black uppercase tracking-[0.3em] text-xs">{t.no_data}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Ratings;