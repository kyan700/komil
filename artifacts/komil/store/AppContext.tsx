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
  Lecture,
  ScheduleEvent,
  Subject,
  Task,
} from "@/lib/types";

interface AppState {
  ready: boolean;
  onboarded: boolean;
  setOnboarded: (v: boolean) => void;
  tasks: Task[];
  subjects: Subject[];
  schedule: ScheduleEvent[];
  inbox: InboxItem[];
  focusSessions: FocusSession[];
  lectures: Lecture[];
  streak: number;
  userName: string;
  university: string;
  major: string;
  level: string;
  setUserName: (name: string) => void;
  setUniversity: (v: string) => void;
  setMajor: (v: string) => void;
  setLevel: (v: string) => void;
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
  // Lectures
  addLecture: (input: Omit<Lecture, "id" | "createdAt" | "attended" | "important"> & { attended?: boolean; important?: boolean }) => Lecture;
  updateLecture: (id: string, patch: Partial<Lecture>) => void;
  deleteLecture: (id: string) => void;
  toggleLectureAttended: (id: string) => void;
  // Inbox
  addInboxItem: (input: Omit<InboxItem, "id" | "createdAt" | "resolved">) => InboxItem;
  resolveInboxItem: (id: string) => void;
  deleteInboxItem: (id: string) => void;
  // Focus
  recordFocusSession: (session: Omit<FocusSession, "id">) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboardedState] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [userName, setUserNameState] = useState<string>("");
  const [university, setUniversityState] = useState<string>("");
  const [major, setMajorState] = useState<string>("");
  const [level, setLevelState] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [t, sub, sch, inb, foc, lec, str, name, uni, maj, lvl, ob] = await Promise.all([
        loadJson<Task[]>(STORAGE_KEYS.tasks, []),
        loadJson<Subject[]>(STORAGE_KEYS.subjects, []),
        loadJson<ScheduleEvent[]>(STORAGE_KEYS.schedule, []),
        loadJson<InboxItem[]>(STORAGE_KEYS.inbox, []),
        loadJson<FocusSession[]>(STORAGE_KEYS.focusSessions, []),
        loadJson<Lecture[]>(STORAGE_KEYS.lectures, []),
        loadJson<number>(STORAGE_KEYS.streak, 0),
        loadJson<string>(STORAGE_KEYS.userName, ""),
        loadJson<string>(STORAGE_KEYS.university, ""),
        loadJson<string>(STORAGE_KEYS.major, ""),
        loadJson<string>(STORAGE_KEYS.level, ""),
        loadJson<boolean>(STORAGE_KEYS.onboarded, false),
      ]);
      if (cancelled) return;
      setTasks(t);
      setSubjects(sub);
      setSchedule(sch);
      setInbox(inb);
      setFocusSessions(foc);
      setLectures(lec);
      setStreak(str);
      setUserNameState(name);
      setUniversityState(uni);
      setMajorState(maj);
      setLevelState(lvl);
      setOnboardedState(ob);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => { if (ready) saveJson(STORAGE_KEYS.tasks, tasks); }, [tasks, ready]);
  useEffect(() => { if (ready) saveJson(STORAGE_KEYS.subjects, subjects); }, [subjects, ready]);
  useEffect(() => { if (ready) saveJson(STORAGE_KEYS.schedule, schedule); }, [schedule, ready]);
  useEffect(() => { if (ready) saveJson(STORAGE_KEYS.inbox, inbox); }, [inbox, ready]);
  useEffect(() => { if (ready) saveJson(STORAGE_KEYS.focusSessions, focusSessions); }, [focusSessions, ready]);
  useEffect(() => { if (ready) saveJson(STORAGE_KEYS.lectures, lectures); }, [lectures, ready]);
  useEffect(() => { if (ready) saveJson(STORAGE_KEYS.streak, streak); }, [streak, ready]);
  useEffect(() => { if (ready) saveJson(STORAGE_KEYS.userName, userName); }, [userName, ready]);
  useEffect(() => { if (ready) saveJson(STORAGE_KEYS.university, university); }, [university, ready]);
  useEffect(() => { if (ready) saveJson(STORAGE_KEYS.major, major); }, [major, ready]);
  useEffect(() => { if (ready) saveJson(STORAGE_KEYS.level, level); }, [level, ready]);
  useEffect(() => { if (ready) saveJson(STORAGE_KEYS.onboarded, onboarded); }, [onboarded, ready]);

  const setOnboarded = useCallback((v: boolean) => setOnboardedState(v), []);
  const setUserName = useCallback((name: string) => setUserNameState(name.trim()), []);
  const setUniversity = useCallback((v: string) => setUniversityState(v.trim()), []);
  const setMajor = useCallback((v: string) => setMajorState(v.trim()), []);
  const setLevel = useCallback((v: string) => setLevelState(v.trim()), []);

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
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
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

  const addLecture: AppState["addLecture"] = useCallback((input) => {
    const lec: Lecture = {
      ...input,
      attended: input.attended ?? false,
      important: input.important ?? false,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setLectures((prev) => [lec, ...prev]);
    return lec;
  }, []);

  const updateLecture = useCallback((id: string, patch: Partial<Lecture>) => {
    setLectures((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  const deleteLecture = useCallback((id: string) => {
    setLectures((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const toggleLectureAttended = useCallback((id: string) => {
    setLectures((prev) => prev.map((l) => (l.id === id ? { ...l, attended: !l.attended } : l)));
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
    setInbox((prev) => prev.map((i) => (i.id === id ? { ...i, resolved: true } : i)));
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
      onboarded,
      setOnboarded,
      tasks,
      subjects,
      schedule,
      inbox,
      focusSessions,
      lectures,
      streak,
      userName,
      university,
      major,
      level,
      setUserName,
      setUniversity,
      setMajor,
      setLevel,
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
      addLecture,
      updateLecture,
      deleteLecture,
      toggleLectureAttended,
      addInboxItem,
      resolveInboxItem,
      deleteInboxItem,
      recordFocusSession,
    }),
    [
      ready, onboarded, setOnboarded,
      tasks, subjects, schedule, inbox, focusSessions, lectures, streak,
      userName, university, major, level,
      setUserName, setUniversity, setMajor, setLevel,
      addTask, updateTask, completeTask, postponeTask, deleteTask, breakdownTask,
      addSubject, updateSubject, deleteSubject,
      addEvent, updateEvent, deleteEvent,
      addLecture, updateLecture, deleteLecture, toggleLectureAttended,
      addInboxItem, resolveInboxItem, deleteInboxItem,
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
