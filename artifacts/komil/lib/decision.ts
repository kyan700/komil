import type { Task, ScheduleEvent } from "./types";

export interface DecisionScore {
  task: Task;
  score: number;
  reasons: string[];
}

export function nextBestTask(
  tasks: Task[],
  _schedule: ScheduleEvent[],
): DecisionScore | null {
  const open = tasks.filter((t) => t.status !== "done" && t.status !== "archived");
  if (open.length === 0) return null;

  const now = Date.now();
  const scored = open.map((task) => {
    const reasons: string[] = [];
    let score = 0;

    if (task.dueDate) {
      const hoursUntilDue = (new Date(task.dueDate).getTime() - now) / (1000 * 60 * 60);
      if (hoursUntilDue < 0) {
        score += 100;
        reasons.push("متأخر عن موعد التسليم");
      } else if (hoursUntilDue < 24) {
        score += 80;
        reasons.push("التسليم خلال 24 ساعة");
      } else if (hoursUntilDue < 72) {
        score += 50;
        reasons.push("التسليم خلال 3 أيام");
      } else {
        score += Math.max(0, 30 - hoursUntilDue / 24);
      }
    }

    if (task.priority === "critical") {
      score += 40;
      reasons.push("أولوية حرجة");
    } else if (task.priority === "high") {
      score += 25;
      reasons.push("أولوية عالية");
    } else if (task.priority === "normal") {
      score += 10;
    }

    if (task.postponedCount > 0) {
      score += task.postponedCount * 8;
      reasons.push(`تم تأجيلها ${task.postponedCount} مرات`);
    }

    if (task.estimatedMinutes && task.estimatedMinutes <= 30) {
      score += 10;
      reasons.push("انتصار سريع (≤30 دقيقة)");
    }

    return { task, score, reasons };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0] ?? null;
}

export function stressLevel(
  tasks: Task[],
): { level: "stable" | "loaded" | "tired" | "critical"; ratio: number; label: string } {
  const open = tasks.filter((t) => t.status !== "done" && t.status !== "archived");
  const now = Date.now();
  let pressure = 0;

  for (const t of open) {
    if (t.dueDate) {
      const hours = (new Date(t.dueDate).getTime() - now) / (1000 * 60 * 60);
      if (hours < 0) pressure += 4;
      else if (hours < 24) pressure += 3;
      else if (hours < 72) pressure += 2;
      else if (hours < 168) pressure += 1;
    }
    if (t.priority === "critical") pressure += 2;
    else if (t.priority === "high") pressure += 1;
    pressure += t.postponedCount * 0.5;
  }

  const ratio = Math.min(1, pressure / 25);

  if (ratio < 0.25) return { level: "stable", ratio, label: "مستقر" };
  if (ratio < 0.55) return { level: "loaded", ratio, label: "محمّل" };
  if (ratio < 0.8) return { level: "tired", ratio, label: "مرهَق" };
  return { level: "critical", ratio, label: "حرج" };
}

export function todayScore(tasks: Task[]): { completed: number; total: number; pct: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayMs = today.getTime();
  const tomorrowMs = tomorrow.getTime();

  const dueToday = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate).getTime();
    return due >= todayMs && due < tomorrowMs;
  });

  const completedToday = dueToday.filter((t) => t.status === "done").length;
  const total = dueToday.length;
  const pct = total === 0 ? 0 : Math.round((completedToday / total) * 100);
  return { completed: completedToday, total, pct };
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "ليلة هادئة";
  if (h < 12) return "صباح الخير";
  if (h < 17) return "مساء الخير";
  if (h < 21) return "مساء الخير";
  return "ليلة موفقة";
}
