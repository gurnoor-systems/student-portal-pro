export interface ActiveDeviceSession {
  deviceId: string;
  deviceName: string;
  deviceType: "mobile" | "desktop" | "tablet";
  ipAddress?: string;
  browser?: string;
  os?: string;
  loginTimestamp: string;
  lastActiveTimestamp: string;
  isCurrentDevice?: boolean;
}

export interface PasskeyCredential {
  credentialId: string;
  publicKey: string;
  counter: number;
  deviceName: string;
  createdAt: string;
  lastUsedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
  googleVerified: boolean;
  university: string;
  degree: string;
  major: string;
  semester: string;
  googleCalendarSynced: boolean;
  densityPreference?: "comfortable" | "compact";
  avatarUrl?: string;
  provider: "email" | "google" | "passkey";
  createdAt: string;
  lastLoginAt?: string;
  sessionExpiresAt?: string;
  activeSessions?: ActiveDeviceSession[];
  passkeys?: PasskeyCredential[];
}

export interface TaskItem {
  id: string;
  userId: string;
  title: string;
  courseCode: string;
  dueDate: string;
  dueTime?: string;
  eventTime?: string;
  meetingLink?: string;
  priority: "high" | "medium" | "low";
  status: "todo" | "in_progress" | "completed";
  category: string;
  syncedToCalendar?: boolean;
  subtasks?: Array<{ id: string; title: string; completed: boolean }>;
}

export interface ExamItem {
  id: string;
  userId: string;
  title: string;
  courseCode: string;
  examDate: string;
  weightPercent: number;
  location?: string;
  topics: string[];
}

export interface CourseItem {
  id: string;
  userId: string;
  courseCode: string;
  courseName: string;
  instructor: string;
  meetingLink?: string;
  meetingPlatform?: "meet" | "zoom" | "teams";
  scheduleTime?: string;
}

export interface MaterialItem {
  id: string;
  courseCode: string;
  folderName: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadedAt: string;
}

export interface StudyMilestone {
  day: string;
  focus: string;
  deliverables: string[];
}

export interface Flashcard {
  id: string;
  courseCode: string;
  frontQuestion: string;
  backAnswer: string;
  difficulty: "easy" | "medium" | "hard";
  mastery: "new" | "learning" | "mastered";
  sourceDocument?: string;
  lastReviewed?: string;
}

export interface TieredFlashcardsResult {
  courseCode: string;
  documentTitle?: string;
  easy: Array<{ question: string; answer: string }>;
  medium: Array<{ question: string; answer: string }>;
  hard: Array<{ question: string; answer: string }>;
  totalCount: number;
}

export interface RegisteredAccount {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  emailVerified: boolean;
  googleVerified: boolean;
  university: string;
  degree: string;
  major: string;
  semester: string;
  googleCalendarSynced: boolean;
  densityPreference?: "comfortable" | "compact";
  provider: "email" | "google";
  createdAt: string;
  lastLoginAt?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "urgent" | "reminder" | "sync" | "system";
  read: boolean;
  actionUrl?: string;
}

// Syllabus Auto-Parser Data Contracts
export interface ParsedDeliverable {
  id: string;
  title: string;
  courseCode: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  priority: "high" | "medium" | "low";
  estimatedHours?: number;
  selected: boolean;
}

export interface ParsedExam {
  id: string;
  name: string; // e.g. "Midterm Exam 1", "Final Exam"
  courseCode: string;
  date: string; // YYYY-MM-DD
  weightPercent: number; // e.g. 35
  selected: boolean;
}

export interface ParsedSyllabusResult {
  courseCode: string;
  courseTitle: string;
  instructor?: string;
  deliverables: ParsedDeliverable[];
  exams: ParsedExam[];
  rawTextPreview?: string;
}

export interface UserData {
  courses: CourseItem[];
  tasks: TaskItem[];
  exams: ExamItem[];
  documents?: any[];
}
