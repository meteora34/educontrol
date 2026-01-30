
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StorageService } from '../store';
import { translations } from '../translations';
import { User, LangType } from '../types';
import { GeminiService } from '../services/geminiService';
import { AudioService } from '../services/audioService';

const Dashboard: React.FC<{ user: User; lang: LangType }> = ({ user, lang }) => {
  const t = translations[lang];
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [collectiveAiReport, setCollectiveAiReport] = useState<string | null>(null);
  const [loadingCollectiveAi, setLoadingCollectiveAi] = useState(false);

  const studentProfiles = useMemo(() => StorageService.getStudentProfiles(), []);
  const news = useMemo(() => StorageService.getNews().slice(0, 3), []);
  const schedule = useMemo(() => StorageService.getSchedule(), []);
  
  const studentData = useMemo(() => {
    if (user.role === 'student') return studentProfiles.find(p => p.id === user.id);
    return null;
  }, [user, studentProfiles]);

  const todayDay = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const todaySchedule = useMemo(() => 
    schedule.filter(s => s.group === user.group && s.day === todayDay).sort((a,b) => a.time.localeCompare(b.time)),
    [schedule, user.group, todayDay]
  );

  const groupStats = useMemo(() => {
    const allGroups = StorageService.getGroups();
    const allAttendance = StorageService.getAttendance();
    return allGroups.map(g => {
      const groupStudents = studentProfiles.filter(p => p.group === g.name);
      const studentIds = new Set(groupStudents.map(s => s.id));
      const groupAttendance = allAttendance.filter(a => studentIds.has(a.studentId));
      const attendanceRate = groupAttendance.length ? (groupAttendance.filter(a => a.status === 'present').length / groupAttendance.length) * 100 : 100;
      const avgRating = groupStudents.length ? groupStudents.reduce((acc, p) => acc + p.rating, 0) / groupStudents.length : 0;
      return { name: g.name, rating: Math.round(avgRating), attendance: Math.round(attendanceRate) };
    });
  }, [studentProfiles]);

  const handleGenReport = async () => {
    if (!studentData) return;
    AudioService.play('click');
    setLoadingAi(true);
    const report = await GeminiService.generateStudentReport(studentData.fullName, {
        grades: studentData.grades.map(g => g.value),
        attendance: studentData.attendance.length,
        rating: studentData.rating
    });
    setAiReport(report);
    setLoadingAi(false);
    AudioService.play('success');
  };

  const handleAnalyzeAllStudents = async () => {
    AudioService.play('click');
    setLoadingCollectiveAi(true);
    const allAttendance = StorageService.getAttendance();
    const overallAvgRating = studentProfiles.length ? studentProfiles.reduce((acc, s) => acc + s.rating, 0) / studentProfiles.length : 0;
    const aggregateData = { collegeSummary: { totalStudents: studentProfiles.length, averageRating: Math.round(overallAvgRating) }, groupsStats: groupStats };
    const report = await GeminiService.generateCollectiveReport(aggregateData);
    setCollectiveAiReport(report);
    setLoadingCollectiveAi(false);
    AudioService.play('success');
  };

  const weekendLabel = lang === 'en' ? 'Day Off' : (lang === 'ky' ? 'Дем алыш' : 'Выходной');

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t.students, val: studentProfiles.length, icon: '👥', color: 'bg-primary' },
          { label: t.attendance, val: '94%', icon: '📈', color: 'bg-accent' },
          { label: t.groups, val: groupStats.length, icon: '🏫', color: 'bg-secondary' },
          { label: t.notifications, val: '4', icon: '🔔', color: 'bg-orange-500' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-8 rounded-3xl shadow-xl flex items-center group hover:scale-[1.02] transition-all cursor-default">
            <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center text-white text-2xl mr-5 shadow-lg group-hover:rotate-12 transition-all`}>{stat.icon}</div>
            <div>
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-1 opacity-80">{stat.label}</p>
              <h4 className="text-3xl font-black text-textMain leading-tight">{stat.val}</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
           {user.role === 'student' && (
             <div className="bg-gradient-to-br from-primary via-secondary to-accent rounded-4xl p-10 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/20 blur-[100px] pointer-events-none"></div>
                <div className="flex items-center space-x-6 relative z-10">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center text-5xl animate-bounce glow-effect">🔥</div>
                    <div>
                        <h3 className="text-3xl font-black mb-1">{user.streakCount || 1} {t.streak_days}</h3>
                        <p className="text-sm font-bold opacity-80 uppercase tracking-widest">{t.keep_it_up}</p>
                    </div>
                </div>
                <div className="mt-8 md:mt-0 w-full md:w-64 bg-white/20 h-4 rounded-full overflow-hidden p-1">
                    <div className="bg-accent h-full rounded-full shadow-lg shadow-accent/50 transition-all duration-1000" style={{ width: `${Math.min(100, ((user.streakCount || 1) % 7) * 14.2)}%` }}></div>
                </div>
             </div>
           )}

            <div className="glass-card rounded-4xl p-10 shadow-sm border border-muted/10">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-black text-textMain uppercase tracking-tight">{t.schedule}</h3>
                    <span className="bg-accent text-white px-5 py-2 rounded-full font-black text-xs uppercase tracking-widest glow-effect">
                      {t.days[todayDay] || weekendLabel}
                    </span>
                </div>
                <div className="space-y-6">
                    {todaySchedule.map(lesson => (
                        <div key={lesson.id} className="flex items-center p-6 bg-primary/5 rounded-3xl border border-transparent hover:border-accent/30 transition-all group">
                            <div className="w-20 text-center border-r border-muted/20 mr-6">
                                <span className="text-[11px] font-black text-accent uppercase block tracking-widest">{lesson.time.split(' ')[0]}</span>
                            </div>
                            <div>
                                <h4 className="font-black text-textMain text-lg">{lesson.subject}</h4>
                                <p className="text-xs text-muted font-bold uppercase tracking-widest opacity-70">{t.room} {lesson.room} • {lesson.teacher}</p>
                            </div>
                        </div>
                    ))}
                    {todaySchedule.length === 0 && <p className="text-center text-muted py-10 font-bold uppercase tracking-[0.2em] opacity-40">{t.no_data}</p>}
                </div>
            </div>
        </div>

        <div className="space-y-10">
            <div className="bg-gradient-to-br from-[#2f3640] to-[#4b6584] rounded-4xl p-8 text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-[60px] pointer-events-none group-hover:bg-accent/40 transition-all duration-700"></div>
               <h4 className="font-black text-xl mb-6 flex items-center uppercase tracking-tighter"><span className="mr-3">🧬</span> {t.ai_assistant}</h4>
               <p className="text-sm opacity-70 mb-8 leading-relaxed font-medium">Neural prediction and smart educational analytics.</p>
               <button 
                 onClick={handleGenReport}
                 disabled={loadingAi}
                 className="w-full py-5 bg-accent text-white rounded-2xl font-black uppercase tracking-widest text-xs neo-button"
               >
                 {loadingAi ? 'Neural Processing...' : t.predict_performance}
               </button>
               {aiReport && (
                  <div className="mt-6 p-5 bg-white/5 backdrop-blur-md rounded-2xl text-[11px] leading-relaxed italic opacity-90 border border-white/10 animate-in zoom-in-95">
                    {aiReport}
                  </div>
               )}
            </div>

            {(user.role === 'admin' || user.role === 'director') && (
               <div className="bg-black text-white rounded-4xl p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 blur-[80px]"></div>
                  <h4 className="font-black text-xl mb-4 flex items-center uppercase tracking-tighter"><span className="mr-3">🧠</span> {t.analyze_all}</h4>
                  <button 
                    onClick={handleAnalyzeAllStudents}
                    disabled={loadingCollectiveAi}
                    className="w-full py-5 border-2 border-accent text-accent hover:bg-accent hover:text-white transition-all rounded-2xl font-black uppercase tracking-widest text-xs"
                  >
                    {loadingCollectiveAi ? 'Aggregating...' : 'Run Analysis'}
                  </button>
                  {collectiveAiReport && (
                    <div className="mt-6 text-[10px] leading-relaxed text-muted prose prose-invert">
                        {collectiveAiReport}
                    </div>
                  )}
               </div>
            )}
        </div>
      </div>

      <div className="glass-card p-10 rounded-4xl shadow-xl border border-muted/10">
        <h3 className="text-2xl font-black text-textMain mb-10 uppercase tracking-tight flex items-center">
            <span className="mr-4">📊</span> Performance Metric Index
        </h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={groupStats}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0, 0, 0, 0.05)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4b6584', fontSize: 11, fontWeight: 'bold' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4b6584', fontSize: 11 }} />
              <Tooltip 
                cursor={{ fill: 'rgba(0, 168, 255, 0.05)' }} 
                contentStyle={{ borderRadius: '24px', border: 'none', backgroundColor: '#2f3640', color: '#fff', padding: '20px' }} 
              />
              <Bar dataKey="rating" name="Rating Index" fill="#00A8FF" radius={[10, 10, 0, 0]} barSize={32} />
              <Bar dataKey="attendance" name="Attendance %" fill="#4cd137" radius={[10, 10, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
