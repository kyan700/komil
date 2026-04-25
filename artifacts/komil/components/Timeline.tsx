import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { arabicFont, arabicFontBold } from "@/constants/typography";
import type { ScheduleEvent, Subject, Task } from "@/lib/types";

interface TimelineItem {
  id: string;
  time: string;
  title: string;
  meta?: string;
  type: "lecture" | "exam" | "task" | "focus";
  done?: boolean;
}

interface Props {
  schedule: ScheduleEvent[];
  tasks: Task[];
  subjects: Subject[];
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function Timeline({ schedule, tasks, subjects }: Props) {
  const colors = useColors();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayMs = today.getTime();
  const tomorrowMs = tomorrow.getTime();

  const items: TimelineItem[] = [];

  for (const ev of schedule) {
    const evDate = new Date(ev.startTime);
    const evMs = evDate.getTime();
    const isToday =
      (evMs >= todayMs && evMs < tomorrowMs) ||
      (ev.recurrence === "weekly" && ev.weekday === new Date().getDay());
    if (!isToday) continue;
    if (ev.type === "holiday") continue;
    const subject = subjects.find((s) => s.id === ev.subjectId);
    items.push({
      id: ev.id,
      time: fmtTime(ev.startTime),
      title: ev.title,
      meta: subject?.name ?? ev.location,
      type: ev.type === "exam" ? "exam" : "lecture",
    });
  }

  for (const t of tasks) {
    if (!t.dueDate) continue;
    const due = new Date(t.dueDate).getTime();
    if (due < todayMs || due >= tomorrowMs) continue;
    items.push({
      id: t.id,
      time: fmtTime(t.dueDate),
      title: t.title,
      meta: subjects.find((s) => s.id === t.subjectId)?.name,
      type: "task",
      done: t.status === "done",
    });
  }

  items.sort((a, b) => a.time.localeCompare(b.time));

  if (items.length === 0) {
    return (
      <View style={[styles.empty, { borderColor: colors.border }]}>
        <Feather name="calendar" size={20} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
          لا توجد أحداث مجدولة لليوم.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const iconName: keyof typeof Feather.glyphMap =
          item.type === "exam"
            ? "alert-circle"
            : item.type === "lecture"
              ? "book-open"
              : item.type === "focus"
                ? "target"
                : "check-square";

        return (
          <View key={item.id} style={styles.row}>
            <View style={styles.timeCol}>
              <Text style={[styles.time, { color: colors.mutedForeground, fontFamily: arabicFontBold }]}>
                {item.time}
              </Text>
            </View>
            <View style={styles.lineCol}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: item.done ? colors.mutedForeground : colors.foreground,
                    borderColor: colors.background,
                  },
                ]}
              />
              {!isLast ? <View style={[styles.line, { backgroundColor: colors.border }]} /> : null}
            </View>
            <View style={[styles.contentCol, { backgroundColor: colors.surface3 }]}>
              <View style={styles.contentHeader}>
                <Feather name={iconName} size={12} color={colors.mutedForeground} />
                <Text
                  style={[
                    styles.itemTitle,
                    {
                      color: item.done ? colors.mutedForeground : colors.foreground,
                      fontFamily: arabicFontBold,
                      textDecorationLine: item.done ? "line-through" : "none",
                    },
                  ]}
                >
                  {item.title}
                </Text>
              </View>
              {item.meta ? (
                <Text style={[styles.itemMeta, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                  {item.meta}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  empty: {
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 10,
  },
  emptyText: {
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 70,
  },
  timeCol: {
    width: 64,
    paddingTop: 8,
    alignItems: "center",
  },
  time: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
  lineCol: {
    width: 22,
    alignItems: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 12,
    borderWidth: 3,
  },
  line: {
    flex: 1,
    width: 1,
    marginTop: 4,
  },
  contentCol: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    gap: 4,
  },
  contentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemTitle: {
    fontSize: 14,
    flex: 1,
  },
  itemMeta: {
    fontSize: 11,
    paddingStart: 20,
  },
});
