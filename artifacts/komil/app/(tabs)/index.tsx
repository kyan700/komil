import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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
  const { tasks, subjects, schedule, addTask, completeTask, recordFocusSession, postponeTask, breakdownTask, userName, lectures, university, major, toggleLectureAttended } = useApp();
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);

  const upcomingLectures = useMemo(() => {
    const now = Date.now();
    return [...lectures]
      .filter((l) => !l.attended && new Date(l.date).getTime() >= now - 30 * 60 * 1000)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [lectures]);

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
          name={userName || "صديقي"}
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
              المحاضرات القادمة
            </Text>
            <Pressable onPress={() => router.push("/lectures")} hitSlop={6}>
              <Text style={[styles.sectionMeta, { color: colors.foreground, fontFamily: arabicFontBold }]}>
                عرض الكل
              </Text>
            </Pressable>
          </View>
          {upcomingLectures.length === 0 ? (
            <View style={[styles.emptyLectures, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="book-open" size={18} color={colors.mutedForeground} />
              <Text style={[styles.emptyLecturesText, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                لا توجد محاضرات قادمة
              </Text>
            </View>
          ) : (
            upcomingLectures.map((lec) => {
              const subj = subjects.find((s) => s.id === lec.subjectId);
              const d = new Date(lec.date);
              const dateLabel = d.toLocaleDateString("ar-SA", { weekday: "short", day: "numeric", month: "short" });
              const timeLabel = d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", hour12: true });
              return (
                <Pressable
                  key={lec.id}
                  onPress={() => router.push("/lectures")}
                  style={[styles.lecMini, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Pressable
                    onPress={() => toggleLectureAttended(lec.id)}
                    hitSlop={10}
                    style={[styles.miniCheck, { borderColor: colors.border }]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={[styles.lecMiniTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
                      {lec.title}{lec.important ? "  ★" : ""}
                    </Text>
                    <Text style={[styles.lecMiniMeta, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                      {dateLabel} · {timeLabel}{subj ? ` · ${subj.name}` : ""}{lec.location ? ` · ${lec.location}` : ""}
                    </Text>
                  </View>
                  <Feather name="chevron-left" size={16} color={colors.mutedForeground} />
                </Pressable>
              );
            })
          )}
        </View>

        {(university || major) && (
          <View style={[styles.contextCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="award" size={14} color={colors.mutedForeground} />
            <Text style={[styles.contextText, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
              {[major, university].filter(Boolean).join(" · ")}
            </Text>
          </View>
        )}

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
  emptyLectures: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyLecturesText: {
    fontSize: 13,
  },
  lecMini: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  miniCheck: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  lecMiniTitle: {
    fontSize: 14,
    textAlign: "right",
  },
  lecMiniMeta: {
    fontSize: 11,
    marginTop: 4,
    textAlign: "right",
  },
  contextCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  contextText: {
    fontSize: 12,
  },
});
