export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
  googleVerified: boolean;
  university: string;
  major: string;
  semester: string;
  googleCalendarSynced: boolean;
  densityPreference?: "comfortable" | "compact";
  avatarUrl?: string;
  provider: "email" | "google";
  createdAt: string;
  lastLoginAt?: string;
}

export interface TaskItem {
  id: string;
  userId: string;
  title: string;
  courseCode: string;
  dueDate: string;
  dueTime?: string;
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
  location: string;
  topics: string[];
}

export interface CourseItem {
  id: string;
  userId: string;
  courseCode: string;
  courseName: string;
  instructor: string;
  meetingLink: string;
  meetingPlatform: "meet" | "zoom" | "teams";
  scheduleTime: string;
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

export interface RegisteredAccount {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  emailVerified: boolean;
  googleVerified: boolean;
  university: string;
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
