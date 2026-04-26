import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  generateId,
  loadJson,
  saveJson,
  STORAGE_KEYS,
} from "@/lib/storage";
import type {
  FocusSession,
  InboxItem,
  ScheduleEvent,
  Subject,
  Task,
} from "@/lib/types";

interface AppState {
  ready: boolean;
  tasks: Task[];
  subjects: Subject[];
  schedule: ScheduleEvent[];
  inbox: InboxItem[];
  focusSessions: FocusSession[];
  streak: number;
  userName: string;
  setUserName: (name: string) => void;
  // Tasks
  addTask: (input: Omit<Task, "id" | "createdAt" | "postponedCount" | "status"> & { status?: Task["status"] }) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  completeTask: (id: string) => void;
  postponeTask: (id: string, hours: number) => void;
  deleteTask: (id: string) => void;
  breakdownTask: (id: string, parts: string[]) => void;
  // Subjects
  addSubject: (input: Omit<Subject, "id" | "createdAt">) => Subject;
  updateSubject: (id: string, patch: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  // Schedule
  addEvent: (input: Omit<ScheduleEvent, "id">) => ScheduleEvent;
  updateEvent: (id: string, patch: Partial<ScheduleEvent>) => void;
  deleteEvent: (id: string) => void;
  // Inbox
  addInboxItem: (input: Omit<InboxItem, "id" | "createdAt" | "resolved">) => InboxItem;
  resolveInboxItem: (id: string) => void;
  deleteInboxItem: (id: string) => void;
  // Focus
  recordFocusSession: (session: Omit<FocusSession, "id">) => void;
}

const AppContext = createContext<AppState | null>(null);

// No seed data — users add their own subjects, tasks, and schedule.
const seedSubjects: Subject[] = [];
const seedTasks: Task[] = [];
const seedSchedule: ScheduleEvent[] = [];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [userName, setUserNameState] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [t, sub, sch, inb, foc, str, name] = await Promise.all([
        loadJson<Task[]>(STORAGE_KEYS.tasks, seedTasks),
        loadJson<Subject[]>(STORAGE_KEYS.subjects, seedSubjects),
        loadJson<ScheduleEvent[]>(STORAGE_KEYS.schedule, seedSchedule),
        loadJson<InboxItem[]>(STORAGE_KEYS.inbox, []),
        loadJson<FocusSession[]>(STORAGE_KEYS.focusSessions, []),
        loadJson<number>(STORAGE_KEYS.streak, 0),
        loadJson<string>(STORAGE_KEYS.userName, ""),
      ]);
      if (cancelled) return;
      setTasks(t);
      setSubjects(sub);
      setSchedule(sch);
      setInbox(inb);
      setFocusSessions(foc);
      setStreak(str);
      setUserNameState(name);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (ready) saveJson(STORAGE_KEYS.tasks, tasks);
  }, [tasks, ready]);
  useEffect(() => {
    if (ready) saveJson(STORAGE_KEYS.subjects, subjects);
  }, [subjects, ready]);
  useEffect(() => {
    if (ready) saveJson(STORAGE_KEYS.schedule, schedule);
  }, [schedule, ready]);
  useEffect(() => {
    if (ready) saveJson(STORAGE_KEYS.inbox, inbox);
  }, [inbox, ready]);
  useEffect(() => {
    if (ready) saveJson(STORAGE_KEYS.focusSessions, focusSessions);
  }, [focusSessions, ready]);
  useEffect(() => {
    if (ready) saveJson(STORAGE_KEYS.streak, streak);
  }, [streak, ready]);
  useEffect(() => {
    if (ready) saveJson(STORAGE_KEYS.userName, userName);
  }, [userName, ready]);

  const setUserName = useCallback((name: string) => {
    setUserNameState(name.trim());
  }, []);

  const addTask: AppState["addTask"] = useCallback((input) => {
    const task: Task = {
      ...input,
      id: generateId(),
      createdAt: new Date().toISOString(),
      postponedCount: 0,
      status: input.status ?? "inbox",
    };
    setTasks((prev) => [task, ...prev]);
    return task;
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const completeTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: "done", completedAt: new Date().toISOString() }
          : t,
      ),
    );
    setStreak((s) => s + 1);
  }, []);

  const postponeTask = useCallback((id: string, hours: number) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const base = t.dueDate ? new Date(t.dueDate) : new Date();
        base.setHours(base.getHours() + hours);
        return {
          ...t,
          dueDate: base.toISOString(),
          postponedCount: t.postponedCount + 1,
        };
      }),
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const breakdownTask = useCallback((id: string, parts: string[]) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, breakdown: parts } : t)));
  }, []);

  const addSubject: AppState["addSubject"] = useCallback((input) => {
    const subject: Subject = {
      ...input,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setSubjects((prev) => [subject, ...prev]);
    return subject;
  }, []);

  const updateSubject = useCallback((id: string, patch: Partial<Subject>) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  }, []);

  const deleteSubject = useCallback((id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const addEvent: AppState["addEvent"] = useCallback((input) => {
    const event: ScheduleEvent = { ...input, id: generateId() };
    setSchedule((prev) => [event, ...prev]);
    return event;
  }, []);

  const updateEvent = useCallback((id: string, patch: Partial<ScheduleEvent>) => {
    setSchedule((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setSchedule((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addInboxItem: AppState["addInboxItem"] = useCallback((input) => {
    const item: InboxItem = {
      ...input,
      id: generateId(),
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    setInbox((prev) => [item, ...prev]);
    return item;
  }, []);

  const resolveInboxItem = useCallback((id: string) => {
    setInbox((prev) =>
      prev.map((i) => (i.id === id ? { ...i, resolved: true } : i)),
    );
  }, []);

  const deleteInboxItem = useCallback((id: string) => {
    setInbox((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const recordFocusSession = useCallback(
    (session: Omit<FocusSession, "id">) => {
      setFocusSessions((prev) => [{ ...session, id: generateId() }, ...prev]);
    },
    [],
  );

  const value = useMemo<AppState>(
    () => ({
      ready,
      tasks,
      subjects,
      schedule,
      inbox,
      focusSessions,
      streak,
      userName,
      setUserName,
      addTask,
      updateTask,
      completeTask,
      postponeTask,
      deleteTask,
      breakdownTask,
      addSubject,
      updateSubject,
      deleteSubject,
      addEvent,
      updateEvent,
      deleteEvent,
      addInboxItem,
      resolveInboxItem,
      deleteInboxItem,
      recordFocusSession,
    }),
    [
      ready,
      tasks,
      subjects,
      schedule,
      inbox,
      focusSessions,
      streak,
      userName,
      setUserName,
      addTask,
      updateTask,
      completeTask,
      postponeTask,
      deleteTask,
      breakdownTask,
      addSubject,
      updateSubject,
      deleteSubject,
      addEvent,
      updateEvent,
      deleteEvent,
      addInboxItem,
      resolveInboxItem,
      deleteInboxItem,
      recordFocusSession,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
