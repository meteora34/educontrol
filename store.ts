import { User, StudentProfile, AttendanceRecord, GradeRecord, DisciplineRecord, ScheduleEntry, LibraryBook, Notification, Group, NewsItem, ChatMessage } from './types';

const STORAGE_KEYS = {
  USERS: 'edu_users',
  ATTENDANCE: 'edu_attendance',
  GRADES: 'edu_grades',
  DISCIPLINE: 'edu_discipline',
  SCHEDULE: 'edu_schedule',
  LIBRARY: 'edu_library',
  NOTIFICATIONS: 'edu_notifications',
  GROUPS: 'edu_groups',
  NEWS: 'edu_news',
  MESSAGES: 'edu_direct_messages',
  SCORES: 'edu_student_scores',
  AI_CHAT: 'edu_ai_chat_history'
};

export const SYSTEM_SUBJECTS = [
  'Mathematics',
  'Algorithms',
  'History',
  'Physics',
  'Literature',
  'Software Development',
  'Data Science',
  'Network Engineering',
  'Cybersecurity',
  'Management',
  'Economics',
  'Psychology',
  'Foreign Language',
  'Philosophy'
];

const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : defaultValue;
};

const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const DEFAULT_GROUPS: Group[] = [
  { id: '1', name: 'CS-101', department: 'IT', course: 1 },
  { id: '2', name: 'ECON-202', department: 'Economics', course: 2 },
  { id: '3', name: 'IT-303', department: 'IT', course: 3 },
  { id: '4', name: 'MGMT-404', department: 'Management', course: 4 }
];

const DEFAULT_SCHEDULE: ScheduleEntry[] = [
  { id: '1', group: 'CS-101', subject: 'Математика', teacher: 'Султанов А.', room: '304', day: 0, time: '08:30 - 10:00' }
];

export const StorageService = {
  getUsers: (): User[] => getFromStorage(STORAGE_KEYS.USERS, []),
  
  addUser: (user: User) => {
    const users = StorageService.getUsers();
    saveToStorage(STORAGE_KEYS.USERS, [...users, user]);
  },

  updateUser: (updatedUser: User) => {
    const users = StorageService.getUsers().map(u => u.id === updatedUser.id ? updatedUser : u);
    saveToStorage(STORAGE_KEYS.USERS, users);
  },

  getAllAvailableSubjects: (): string[] => {
    const users = StorageService.getUsers();
    const teacherSubjects = users
      .filter(u => u.role === 'teacher' && u.subjects)
      .flatMap(u => u.subjects || []);
    
    const combined = [...SYSTEM_SUBJECTS, ...teacherSubjects];
    return Array.from(new Set(combined)).sort();
  },

  handleUserStreak: (user: User): User => {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = user.lastLoginDate;
    let newStreak = user.streakCount || 1;

    if (lastDate === today) {
      return user;
    }

    if (lastDate) {
      const last = new Date(lastDate);
      const curr = new Date(today);
      const diffTime = Math.abs(curr.getTime() - last.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const updated = { ...user, streakCount: newStreak, lastLoginDate: today };
    StorageService.updateUser(updated);
    return updated;
  },

  getGroups: (): Group[] => getFromStorage(STORAGE_KEYS.GROUPS, DEFAULT_GROUPS),
  addGroup: (group: Group) => {
    const groups = StorageService.getGroups();
    saveToStorage(STORAGE_KEYS.GROUPS, [...groups, group]);
  },
  deleteGroup: (id: string) => {
    const groups = StorageService.getGroups().filter(g => g.id !== id);
    saveToStorage(STORAGE_KEYS.GROUPS, groups);
  },

  getNews: (): NewsItem[] => getFromStorage(STORAGE_KEYS.NEWS, []),
  addNews: (news: NewsItem) => {
    const allNews = StorageService.getNews();
    saveToStorage(STORAGE_KEYS.NEWS, [news, ...allNews]);
  },
  deleteNews: (id: string) => {
    const allNews = StorageService.getNews().filter(n => n.id !== id);
    saveToStorage(STORAGE_KEYS.NEWS, allNews);
  },

  getAttendance: (): AttendanceRecord[] => getFromStorage(STORAGE_KEYS.ATTENDANCE, []),
  saveAttendance: (records: AttendanceRecord[]) => {
    const all = StorageService.getAttendance();
    const filtered = all.filter(old => !records.some(nr => nr.studentId === old.studentId && nr.date === old.date && nr.subject === old.subject));
    saveToStorage(STORAGE_KEYS.ATTENDANCE, [...filtered, ...records]);
  },

  getGrades: (): GradeRecord[] => getFromStorage(STORAGE_KEYS.GRADES, []),

  getDiscipline: (): DisciplineRecord[] => getFromStorage(STORAGE_KEYS.DISCIPLINE, []),

  getSchedule: (): ScheduleEntry[] => getFromStorage(STORAGE_KEYS.SCHEDULE, DEFAULT_SCHEDULE),
  addScheduleEntry: (entry: ScheduleEntry) => {
    const all = StorageService.getSchedule();
    saveToStorage(STORAGE_KEYS.SCHEDULE, [...all, entry]);
  },
  updateScheduleEntry: (updated: ScheduleEntry) => {
    const all = StorageService.getSchedule().map(s => s.id === updated.id ? updated : s);
    saveToStorage(STORAGE_KEYS.SCHEDULE, all);
  },
  deleteScheduleEntry: (id: string) => {
    const all = StorageService.getSchedule().filter(s => s.id !== id);
    saveToStorage(STORAGE_KEYS.SCHEDULE, all);
  },

  getLibrary: (): LibraryBook[] => getFromStorage(STORAGE_KEYS.LIBRARY, []),
  addLibraryBook: (book: LibraryBook) => {
    const all = StorageService.getLibrary();
    saveToStorage(STORAGE_KEYS.LIBRARY, [...all, book]);
  },
  updateLibraryBook: (updated: LibraryBook) => {
    const all = StorageService.getLibrary().map(b => b.id === updated.id ? updated : b);
    saveToStorage(STORAGE_KEYS.LIBRARY, all);
  },
  deleteLibraryBook: (id: string) => {
    const all = StorageService.getLibrary().filter(b => b.id !== id);
    saveToStorage(STORAGE_KEYS.LIBRARY, all);
  },

  getDirectMessages: (uid1: string, uid2: string): ChatMessage[] => {
    const all: ChatMessage[] = getFromStorage(STORAGE_KEYS.MESSAGES, []);
    return all.filter(m => 
      (m.senderId === uid1 && m.receiverId === uid2) || 
      (m.senderId === uid2 && m.receiverId === uid1)
    ).sort((a, b) => a.timestamp - b.timestamp);
  },
  sendDirectMessage: (msg: ChatMessage) => {
    const all = getFromStorage<ChatMessage[]>(STORAGE_KEYS.MESSAGES, []);
    saveToStorage(STORAGE_KEYS.MESSAGES, [...all, msg]);
  },

  getStudentScores: (): Record<string, { current: number, previous: number }> => 
    getFromStorage(STORAGE_KEYS.SCORES, {}),
  
  saveStudentScore: (studentId: string, score: number) => {
    const scores = StorageService.getStudentScores();
    const prev = scores[studentId]?.current || 0;
    scores[studentId] = { current: score, previous: prev };
    saveToStorage(STORAGE_KEYS.SCORES, scores);
  },

  getAIChatHistory: (userId: string): {role: 'user' | 'model', text: string}[] => {
    const allHistory = getFromStorage<Record<string, {role: 'user' | 'model', text: string}[]>>(STORAGE_KEYS.AI_CHAT, {});
    return allHistory[userId] || [];
  },

  saveAIChatHistory: (userId: string, history: {role: 'user' | 'model', text: string}[]) => {
    const allHistory = getFromStorage<Record<string, {role: 'user' | 'model', text: string}[]>>(STORAGE_KEYS.AI_CHAT, {});
    allHistory[userId] = history;
    saveToStorage(STORAGE_KEYS.AI_CHAT, allHistory);
  },

  getStudentProfiles: (): StudentProfile[] => {
    const users = StorageService.getUsers().filter(u => u.role === 'student');
    const attendance = StorageService.getAttendance();
    const grades = StorageService.getGrades();
    const discipline = StorageService.getDiscipline();
    const scores = StorageService.getStudentScores();

    return users.map(u => {
      const studentAttendance = attendance.filter(a => a.studentId === u.id);
      const academicScore = scores[u.id]?.current || 0;
      
      const totalSessions = studentAttendance.length;
      let attendanceRate = 100;
      if (totalSessions > 0) {
        const points = studentAttendance.reduce((acc, curr) => {
          if (curr.status === 'present') return acc + 1;
          if (curr.status === 'late') return acc + 0.5;
          return acc;
        }, 0);
        attendanceRate = (points / totalSessions) * 100;
      }

      const finalRating = Math.round((academicScore * 0.8) + (attendanceRate * 0.2));

      return {
        ...u,
        attendance: studentAttendance,
        grades: grades.filter(g => g.studentId === u.id),
        discipline: discipline.filter(d => d.studentId === u.id),
        rating: finalRating,
        academicScore: academicScore
      };
    }) as StudentProfile[];
  }
};