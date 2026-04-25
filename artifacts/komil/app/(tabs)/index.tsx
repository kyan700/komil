import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { FAB } from "@/components/FAB";
import { FocusModal } from "@/components/FocusModal";
import { HeroCard } from "@/components/HeroCard";
import { NextBestTaskCard } from "@/components/NextBestTaskCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StressMeter } from "@/components/StressMeter";
import { Timeline } from "@/components/Timeline";
import { AddTaskSheet } from "@/components/AddTaskSheet";
import { useColors } from "@/hooks/useColors";
import { arabicFont, arabicFontBold, arabicFontHeavy } from "@/constants/typography";
import { getGreeting, nextBestTask, stressLevel, todayScore } from "@/lib/decision";
import { useApp } from "@/store/AppContext";

function offsetToIso(offset: "today" | "tomorrow" | "week" | "none"): string | undefined {
  if (offset === "none") return undefined;
  const d = new Date();
  if (offset === "tomorrow") d.setDate(d.getDate() + 1);
  if (offset === "week") d.setDate(d.getDate() + 7);
  d.setHours(20, 0, 0, 0);
  return d.toISOString();
}

export default function TodayScreen() {
  const colors = useColors();
  const { tasks, subjects, schedule, addTask, completeTask, recordFocusSession, postponeTask, breakdownTask } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);

  const greeting = getGreeting();
  const score = useMemo(() => todayScore(tasks), [tasks]);
  const stress = useMemo(() => stressLevel(tasks), [tasks]);
  const decision = useMemo(() => nextBestTask(tasks, schedule), [tasks, schedule]);
  const decisionSubject = decision
    ? subjects.find((s) => s.id === decision.task.subjectId)
    : undefined;
  const criticalCount = useMemo(
    () => tasks.filter((t) => t.priority === "critical" && t.status !== "done").length,
    [tasks],
  );

  const focusWindow = useMemo(() => {
    const now = new Date();
    const upcoming = schedule
      .filter((e) => e.type === "lecture")
      .map((e) => new Date(e.startTime))
      .filter((d) => d.getTime() > now.getTime() && d.getDate() === now.getDate())
      .sort((a, b) => a.getTime() - b.getTime())[0];
    if (!upcoming) return null;
    return upcoming.toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, [schedule]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="اليوم" subtitle={focusWindow ? `نافذة تركيز: ${focusWindow}` : "يوم هادئ"} rightIcon="search" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HeroCard
          greeting={greeting}
          name="معمر"
          criticalCount={criticalCount}
          todayPct={score.pct}
          todayCompleted={score.completed}
          todayTotal={score.total}
          onStartNext={() => decision && setFocusOpen(true)}
          onReplan={() => {}}
        />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
              أفضل مهمة الآن
            </Text>
          </View>
          <NextBestTaskCard
            decision={decision}
            subject={decisionSubject}
            onStart={() => setFocusOpen(true)}
            onPostpone={() => decision && postponeTask(decision.task.id, 4)}
            onBreakdown={() =>
              decision &&
              breakdownTask(decision.task.id, [
                "اقرأ المرجع",
                "اكتب المسوّدة الأولى",
                "راجع وحرر",
              ])
            }
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }, styles.stressCard]}>
          <StressMeter ratio={stress.ratio} label={stress.label} level={stress.level} />
          <View style={styles.stressFooter}>
            <Feather name="info" size={11} color={colors.mutedForeground} />
            <Text style={[styles.stressNote, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
              يحسب من المواعيد القريبة، الأولويات، والمهام المؤجلة
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
              الخط الزمني
            </Text>
            <Text style={[styles.sectionMeta, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
              محاضرات + مهام
            </Text>
          </View>
          <Timeline schedule={schedule} tasks={tasks} subjects={subjects} />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <FAB onPress={() => setAddOpen(true)} />

      <AddTaskSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
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

      <FocusModal
        visible={focusOpen && !!decision}
        onClose={() => setFocusOpen(false)}
        taskTitle={decision?.task.title ?? ""}
        initialMinutes={decision?.task.estimatedMinutes ?? 25}
        onComplete={(actualMinutes, interruptions) => {
          if (decision) {
            recordFocusSession({
              taskId: decision.task.id,
              plannedMinutes: decision.task.estimatedMinutes ?? 25,
              actualMinutes,
              interruptions,
              startedAt: new Date(Date.now() - actualMinutes * 60 * 1000).toISOString(),
              endedAt: new Date().toISOString(),
            });
            completeTask(decision.task.id);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 24,
  },
  section: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    letterSpacing: -0.3,
  },
  sectionMeta: {
    fontSize: 11,
  },
  stressCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  stressFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  stressNote: {
    fontSize: 11,
    flex: 1,
  },
});
