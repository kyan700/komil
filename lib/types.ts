export type TaskPriority = "low" | "normal" | "high" | "critical";
export type TaskStatus = "inbox" | "planned" | "done" | "archived";

export interface Task {
  id: string;
  title: string;
  notes?: string;
  subjectId?: string;
  dueDate?: string; // ISO
  estimatedMinutes?: number;
  priority: TaskPriority;
  status: TaskStatus;
  breakdown?: string[];
  postponedCount: number;
  createdAt: string;
  completedAt?: string;
}

export interface Subject {
  id: string;
  name: string;
  instructor?: string;
  shade: string; // gray shade hex
  createdAt: string;
}

export type ScheduleEventType = "lecture" | "exam" | "holiday";

export interface ScheduleEvent {
  id: string;
  type: ScheduleEventType;
  title: string;
  subjectId?: string;
  startTime: string; // ISO
  endTime: string; // ISO
  location?: string;
  recurrence?: "none" | "weekly";
  weekday?: number; // 0-6 if weekly
}

export interface InboxItem {
  id: string;
  text: string;
  source: "voice" | "scan" | "manual";
  createdAt: string;
  resolved: boolean;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  plannedMinutes: number;
  actualMinutes: number;
  interruptions: number;
  startedAt: string;
  endedAt?: string;
}

export interface Lecture {
  id: string;
  subjectId?: string;
  title: string;
  date: string; // ISO date string
  durationMinutes?: number;
  location?: string;
  notes?: string;
  attended: boolean;
  important: boolean;
  createdAt: string;
}

export interface Recording {
  id: string;
  name: string;
  subjectId?: string; // undefined => uncategorized
  uri: string; // local file:// path
  durationMs: number;
  sizeBytes: number;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  university?: string;
  major?: string;
  level?: string; // e.g. "السنة الثانية"
}
