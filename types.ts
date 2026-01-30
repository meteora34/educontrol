
export type Role = 'student' | 'teacher' | 'admin' | 'director';

export type ThemeName = 'dark' | 'light' | 'arctic' | 'cyber';
export type LangType = 'ru' | 'ky' | 'en';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  group?: string;
  course?: number; // 1, 2, 3, 4
  subjects?: string[]; // New: For teachers
  avatar?: string;
  registeredAt: number;
  streakCount?: number;
  lastLoginDate?: string; // Формат YYYY-MM-DD
}

export interface Group {
  id: string;
  name: string;
  department: string;
  course: number; // 1, 2, 3, 4
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: number;
  authorName: string;
}

export interface StudentProfile extends User {
  attendance: AttendanceRecord[];
  grades: GradeRecord[];
  discipline: DisciplineRecord[];
  rating: number;
  // academicScore is calculated in StorageService.getStudentProfiles and used in UI components
  academicScore: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  subject: string;
  teacher?: string;
  time?: string;
}

export interface GradeRecord {
  id: string;
  studentId: string;
  subject: string;
  value: number;
  date: string;
}

export interface DisciplineRecord {
  id: string;
  studentId: string;
  teacherId: string;
  remark: string;
  severity: 'low' | 'medium' | 'high';
  date: string;
}

export interface ScheduleEntry {
  id: string;
  group: string;
  subject: string;
  teacher: string;
  room: string;
  day: number;
  time: string;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  url: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  read: boolean;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
  read: boolean;
}
