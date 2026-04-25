import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AddEventSheet } from "@/components/AddEventSheet";
import { AddSubjectSheet } from "@/components/AddSubjectSheet";
import { AddTaskSheet } from "@/components/AddTaskSheet";
import { EmptyState } from "@/components/EmptyState";
import { FAB } from "@/components/FAB";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TaskRow } from "@/components/TaskRow";
import { useColors } from "@/hooks/useColors";
import { arabicFont, arabicFontBold } from "@/constants/typography";
import type { ScheduleEvent, Task } from "@/lib/types";
import { useApp } from "@/store/AppContext";

type TabKey = "inbox" | "planned" | "deadlines" | "subjects" | "schedule";

const TABS: { key: TabKey; label: string }[] = [
  { key: "inbox", label: "الوارد" },
  { key: "planned", label: "المخطط" },
  { key: "deadlines", label: "المواعيد" },
  { key: "subjects", label: "المواد" },
  { key: "schedule", label: "الجدول" },
];

function offsetToIso(offset: "today" | "tomorrow" | "week" | "none"): string | undefined {
  if (offset === "none") return undefined;
  const d = new Date();
  if (offset === "tomorrow") d.setDate(d.getDate() + 1);
  if (offset === "week") d.setDate(d.getDate() + 7);
  d.setHours(20, 0, 0, 0);
  return d.toISOString();
}

export default function TasksScreen() {
  const colors = useColors();
  const {
    tasks,
    subjects,
    schedule,
    addTask,
    completeTask,
    addSubject,
    deleteSubject,
    addEvent,
    deleteEvent,
  } = useApp();
  const [activeTab, setActiveTab] = useState<TabKey>("planned");
  const [taskOpen, setTaskOpen] = useState(false);
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);

  const filteredTasks = useMemo(() => {
    if (activeTab === "inbox") {
      return tasks.filter((t) => t.status === "inbox");
    }
    if (activeTab === "planned") {
      return tasks.filter((t) => t.status === "planned" || t.status === "done");
    }
    if (activeTab === "deadlines") {
      return tasks
        .filter((t) => t.dueDate && t.status !== "done" && t.status !== "archived")
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    }
    return [];
  }, [tasks, activeTab]);

  const upcomingExams = useMemo(
    () =>
      schedule
        .filter((e) => e.type === "exam" && new Date(e.startTime).getTime() > Date.now())
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [schedule],
  );

  const handleFabPress = () => {
    if (activeTab === "subjects") setSubjectOpen(true);
    else if (activeTab === "schedule") setEventOpen(true);
    else setTaskOpen(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="المهام والجدول" subtitle="منهجك بالكامل في مكان واحد" rightIcon="search" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {TABS.map((t) => {
          const active = activeTab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={({ pressed }) => [
                styles.tab,
                {
                  backgroundColor: active ? colors.foreground : "transparent",
                  borderColor: active ? colors.foreground : colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: active ? colors.background : colors.foreground,
                    fontFamily: arabicFontBold,
                  },
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === "subjects" ? (
          <SubjectsList subjects={subjects} tasks={tasks} onDelete={deleteSubject} />
        ) : activeTab === "schedule" ? (
          <ScheduleList events={schedule} subjects={subjects} onDelete={deleteEvent} />
        ) : (
          <>
            {activeTab === "deadlines" && upcomingExams.length > 0 ? (
              <View style={styles.examBlock}>
                <Text style={[styles.blockTitle, { color: colors.mutedForeground, fontFamily: arabicFontBold }]}>
                  امتحانات قادمة
                </Text>
                {upcomingExams.slice(0, 3).map((e) => {
                  const subject = subjects.find((s) => s.id === e.subjectId);
                  const days = Math.ceil(
                    (new Date(e.startTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                  );
                  return (
                    <View
                      key={e.id}
                      style={[styles.examCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <View style={[styles.examIcon, { borderColor: colors.foreground }]}>
                        <Feather name="alert-circle" size={16} color={colors.foreground} />
                      </View>
                      <View style={styles.examBody}>
                        <Text style={[styles.examTitle, { color: colors.foreground, fontFamily: arabicFontBold }]}>
                          {e.title}
                        </Text>
                        {subject ? (
                          <Text style={[styles.examMeta, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                            {subject.name}
                          </Text>
                        ) : null}
                      </View>
                      <View style={[styles.examDays, { backgroundColor: colors.surface3 }]}>
                        <Text style={[styles.examDaysText, { color: colors.foreground, fontFamily: arabicFontBold }]}>
                          {days}
                        </Text>
                        <Text style={[styles.examDaysLabel, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                          {days === 1 ? "يوم" : "أيام"}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {filteredTasks.length === 0 ? (
              <EmptyState
                icon={
                  activeTab === "inbox"
                    ? "inbox"
                    : activeTab === "deadlines"
                      ? "calendar"
                      : "check-square"
                }
                title={
                  activeTab === "inbox"
                    ? "لا يوجد عناصر في الوارد"
                    : activeTab === "deadlines"
                      ? "لا توجد مواعيد قريبة"
                      : "لا توجد مهام مخططة"
                }
                description={
                  activeTab === "inbox"
                    ? "العناصر الجديدة من المسجل والماسح ستظهر هنا قبل اعتمادها"
                    : "اضغط على الزر العائم لإضافة مهمة جديدة"
                }
              />
            ) : (
              <View style={styles.list}>
                {filteredTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    subject={subjects.find((s) => s.id === task.subjectId)}
                    onComplete={completeTask}
                  />
                ))}
              </View>
            )}
          </>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      <FAB
        onPress={handleFabPress}
        icon={activeTab === "subjects" ? "book" : activeTab === "schedule" ? "calendar" : "plus"}
      />

      <AddTaskSheet
        visible={taskOpen}
        onClose={() => setTaskOpen(false)}
        subjects={subjects}
        onSubmit={(input) => {
          addTask({
            title: input.title,
            notes: input.notes,
            subjectId: input.subjectId,
            estimatedMinutes: input.estimatedMinutes,
            priority: input.priority,
            dueDate: offsetToIso(input.dueOffset),
            status: "planned",
          });
        }}
      />

      <AddSubjectSheet
        visible={subjectOpen}
        onClose={() => setSubjectOpen(false)}
        onSubmit={(input) => addSubject(input)}
      />

      <AddEventSheet
        visible={eventOpen}
        onClose={() => setEventOpen(false)}
        subjects={subjects}
        onSubmit={(input) => {
          const start = new Date();
          if (input.type === "lecture") {
            const today = start.getDay();
            const diff = (input.weekday - today + 7) % 7;
            start.setDate(start.getDate() + (diff === 0 ? 0 : diff));
          } else {
            start.setDate(start.getDate() + input.daysFromNow);
          }
          start.setHours(input.hour, 0, 0, 0);
          const end = new Date(start.getTime() + input.durationMinutes * 60 * 1000);
          addEvent({
            type: input.type,
            title: input.title,
            subjectId: input.subjectId,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            location: input.location,
            recurrence: input.type === "lecture" ? "weekly" : "none",
            weekday: input.type === "lecture" ? input.weekday : undefined,
          });
        }}
      />
    </View>
  );
}

function SubjectsList({
  subjects,
  tasks,
  onDelete,
}: {
  subjects: ReturnType<typeof useApp>["subjects"];
  tasks: Task[];
  onDelete: (id: string) => void;
}) {
  const colors = useColors();

  if (subjects.length === 0) {
    return (
      <EmptyState
        icon="book"
        title="لا توجد مواد بعد"
        description="اضغط على الزر العائم لإضافة مادة جديدة"
      />
    );
  }

  return (
    <View style={styles.list}>
      {subjects.map((s) => {
        const subjectTaskCount = tasks.filter((t) => t.subjectId === s.id && t.status !== "done").length;
        return (
          <View
            key={s.id}
            style={[styles.subjectCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.subjectIcon, { borderColor: colors.border }]}>
              <View style={[styles.subjectDot, { backgroundColor: s.shade }]} />
            </View>
            <View style={styles.subjectBody}>
              <Text style={[styles.subjectName, { color: colors.foreground, fontFamily: arabicFontBold }]}>
                {s.name}
              </Text>
              {s.instructor ? (
                <Text style={[styles.subjectMeta, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                  {s.instructor} · {subjectTaskCount} مهمة مفتوحة
                </Text>
              ) : (
                <Text style={[styles.subjectMeta, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                  {subjectTaskCount} مهمة مفتوحة
                </Text>
              )}
            </View>
            <Pressable
              onPress={() => onDelete(s.id)}
              hitSlop={12}
              style={({ pressed }) => [styles.iconBtnGhost, { opacity: pressed ? 0.5 : 1 }]}
            >
              <Feather name="trash-2" size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

function ScheduleList({
  events,
  subjects,
  onDelete,
}: {
  events: ScheduleEvent[];
  subjects: ReturnType<typeof useApp>["subjects"];
  onDelete: (id: string) => void;
}) {
  const colors = useColors();
  if (events.length === 0) {
    return (
      <EmptyState
        icon="calendar"
        title="لا توجد أحداث في الجدول"
        description="أضف محاضراتك، امتحاناتك، وإجازاتك"
      />
    );
  }

  const sorted = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  return (
    <View style={styles.list}>
      {sorted.map((e) => {
        const subject = subjects.find((s) => s.id === e.subjectId);
        const date = new Date(e.startTime);
        const dateStr = date.toLocaleDateString("ar-EG", {
          weekday: "long",
          month: "short",
          day: "numeric",
        });
        const timeStr = date.toLocaleTimeString("ar-EG", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const typeLabel = e.type === "lecture" ? "محاضرة" : e.type === "exam" ? "امتحان" : "إجازة";
        const iconName: keyof typeof Feather.glyphMap =
          e.type === "lecture" ? "book-open" : e.type === "exam" ? "alert-circle" : "coffee";
        return (
          <View
            key={e.id}
            style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.eventIcon, { borderColor: colors.border }]}>
              <Feather name={iconName} size={16} color={colors.foreground} />
            </View>
            <View style={styles.eventBody}>
              <View style={styles.eventTopRow}>
                <Text style={[styles.eventTitle, { color: colors.foreground, fontFamily: arabicFontBold }]}>
                  {e.title}
                </Text>
                <View style={[styles.eventTypeBadge, { borderColor: colors.border }]}>
                  <Text style={[styles.eventTypeText, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                    {typeLabel}
                  </Text>
                </View>
              </View>
              <Text style={[styles.eventMeta, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                {e.recurrence === "weekly" ? `كل أسبوع · ${timeStr}` : `${dateStr} · ${timeStr}`}
                {e.location ? ` · ${e.location}` : ""}
                {subject ? ` · ${subject.name}` : ""}
              </Text>
            </View>
            <Pressable
              onPress={() => onDelete(e.id)}
              hitSlop={12}
              style={({ pressed }) => [styles.iconBtnGhost, { opacity: pressed ? 0.5 : 1 }]}
            >
              <Feather name="trash-2" size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 18,
  },
  list: {
    gap: 10,
  },
  examBlock: {
    gap: 10,
    marginBottom: 8,
  },
  blockTitle: {
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  examCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  examIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  examBody: {
    flex: 1,
    gap: 4,
  },
  examTitle: {
    fontSize: 14,
  },
  examMeta: {
    fontSize: 11,
  },
  examDays: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  examDaysText: {
    fontSize: 18,
    lineHeight: 22,
  },
  examDaysLabel: {
    fontSize: 9,
    letterSpacing: 0.3,
  },
  subjectCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  subjectIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  subjectDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  subjectBody: {
    flex: 1,
    gap: 4,
  },
  subjectName: {
    fontSize: 15,
  },
  subjectMeta: {
    fontSize: 11,
  },
  iconBtnGhost: {
    padding: 8,
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  eventBody: {
    flex: 1,
    gap: 6,
  },
  eventTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  eventTitle: {
    fontSize: 14,
    flex: 1,
  },
  eventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  eventTypeText: {
    fontSize: 10,
  },
  eventMeta: {
    fontSize: 11,
    lineHeight: 16,
  },
});
