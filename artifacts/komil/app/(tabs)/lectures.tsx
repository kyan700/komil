import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useColors } from "@/hooks/useColors";
import { arabicFont, arabicFontBold, arabicFontHeavy } from "@/constants/typography";
import type { Lecture } from "@/lib/types";
import { useApp } from "@/store/AppContext";

type Filter = "all" | "today" | "week" | "important";

export default function LecturesScreen() {
  const colors = useColors();
  const { lectures, subjects, addLecture, updateLecture, deleteLecture, toggleLectureAttended } = useApp();

  const [filter, setFilter] = useState<Filter>("all");
  const [editor, setEditor] = useState<{ open: boolean; lecture?: Lecture }>({ open: false });

  const list = useMemo(() => {
    const sorted = [...lectures].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    if (filter === "all") return sorted;
    if (filter === "important") return sorted.filter((l) => l.important);
    const now = new Date();
    if (filter === "today") {
      return sorted.filter((l) => {
        const d = new Date(l.date);
        return d.toDateString() === now.toDateString();
      });
    }
    if (filter === "week") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return sorted.filter((l) => {
        const d = new Date(l.date);
        return d >= start && d < end;
      });
    }
    return sorted;
  }, [lectures, filter]);

  const stats = useMemo(() => {
    const total = lectures.length;
    const attended = lectures.filter((l) => l.attended).length;
    const pct = total > 0 ? Math.round((attended / total) * 100) : 0;
    return { total, attended, pct };
  }, [lectures]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="المحاضرات" subtitle={stats.total ? `${stats.attended}/${stats.total} حضور · ${stats.pct}%` : "نظّم محاضراتك"} />

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {(["all", "today", "week", "important"] as Filter[]).map((f) => {
          const active = filter === f;
          const labels: Record<Filter, string> = {
            all: "الكل",
            today: "اليوم",
            week: "هذا الأسبوع",
            important: "مهم",
          };
          return (
            <Pressable
              key={f}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
                setFilter(f);
              }}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.foreground : colors.surface,
                  borderColor: active ? colors.foreground : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: active ? colors.background : colors.foreground,
                    fontFamily: active ? arabicFontBold : arabicFont,
                  },
                ]}
              >
                {labels[f]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.listScroll}
        showsVerticalScrollIndicator={false}
      >
        {list.length === 0 ? (
          <EmptyState
            icon="book-open"
            title="لا توجد محاضرات"
            description="اضغط الزر السفلي لإضافة محاضرة جديدة"
          />
        ) : (
          list.map((lec) => {
            const subj = subjects.find((s) => s.id === lec.subjectId);
            const d = new Date(lec.date);
            const dateLabel = d.toLocaleDateString("ar-SA", {
              weekday: "long",
              day: "numeric",
              month: "short",
            });
            const timeLabel = d.toLocaleTimeString("ar-SA", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });
            return (
              <Pressable
                key={lec.id}
                onPress={() => setEditor({ open: true, lecture: lec })}
                onLongPress={() => {
                  Alert.alert("حذف المحاضرة", `هل تريد حذف "${lec.title}"؟`, [
                    { text: "إلغاء", style: "cancel" },
                    {
                      text: "حذف", style: "destructive",
                      onPress: () => deleteLecture(lec.id),
                    },
                  ]);
                }}
                style={[styles.lecCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.lecRow}>
                  <Pressable
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
                      toggleLectureAttended(lec.id);
                    }}
                    hitSlop={12}
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: lec.attended ? colors.foreground : "transparent",
                        borderColor: lec.attended ? colors.foreground : colors.border,
                      },
                    ]}
                  >
                    {lec.attended && (
                      <Feather name="check" size={14} color={colors.background} />
                    )}
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <View style={styles.lecHeader}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.lecTitle,
                          {
                            color: colors.foreground,
                            fontFamily: arabicFontHeavy,
                            textDecorationLine: lec.attended ? "line-through" : "none",
                            opacity: lec.attended ? 0.6 : 1,
                          },
                        ]}
                      >
                        {lec.title}
                      </Text>
                      {lec.important && (
                        <Feather name="star" size={14} color={colors.foreground} />
                      )}
                    </View>
                    <View style={styles.metaRow}>
                      <Feather name="calendar" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                        {dateLabel} · {timeLabel}
                      </Text>
                    </View>
                    {(subj || lec.location) && (
                      <View style={styles.metaRow}>
                        {subj && (
                          <>
                            <Feather name="bookmark" size={12} color={colors.mutedForeground} />
                            <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                              {subj.name}
                            </Text>
                          </>
                        )}
                        {lec.location && (
                          <>
                            <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                            <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                              {lec.location}
                            </Text>
                          </>
                        )}
                      </View>
                    )}
                    {lec.notes ? (
                      <Text
                        numberOfLines={2}
                        style={[styles.notesText, { color: colors.mutedForeground, fontFamily: arabicFont }]}
                      >
                        {lec.notes}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          setEditor({ open: true });
        }}
        style={[styles.fab, { backgroundColor: colors.foreground }]}
      >
        <Feather name="plus" size={24} color={colors.background} />
      </Pressable>

      <LectureEditor
        open={editor.open}
        lecture={editor.lecture}
        onClose={() => setEditor({ open: false })}
        onSave={(data) => {
          if (editor.lecture) {
            updateLecture(editor.lecture.id, data);
          } else {
            addLecture(data as any);
          }
          setEditor({ open: false });
        }}
      />
    </View>
  );
}

function LectureEditor({
  open,
  lecture,
  onClose,
  onSave,
}: {
  open: boolean;
  lecture?: Lecture;
  onClose: () => void;
  onSave: (data: Partial<Lecture>) => void;
}) {
  const colors = useColors();
  const { subjects } = useApp();

  const [title, setTitle] = useState(lecture?.title ?? "");
  const [notes, setNotes] = useState(lecture?.notes ?? "");
  const [location, setLocation] = useState(lecture?.location ?? "");
  const [subjectId, setSubjectId] = useState<string | undefined>(lecture?.subjectId);
  const [important, setImportant] = useState<boolean>(lecture?.important ?? false);
  const [duration, setDuration] = useState<string>(
    lecture?.durationMinutes ? String(lecture.durationMinutes) : "",
  );
  const [dateOffset, setDateOffset] = useState<"now" | "today" | "tomorrow" | "week">(
    lecture ? "now" : "today",
  );

  React.useEffect(() => {
    if (open) {
      setTitle(lecture?.title ?? "");
      setNotes(lecture?.notes ?? "");
      setLocation(lecture?.location ?? "");
      setSubjectId(lecture?.subjectId);
      setImportant(lecture?.important ?? false);
      setDuration(lecture?.durationMinutes ? String(lecture.durationMinutes) : "");
      setDateOffset(lecture ? "now" : "today");
    }
  }, [open, lecture]);

  const handleSave = () => {
    if (!title.trim()) return;
    let dateIso: string;
    if (lecture && dateOffset === "now") {
      dateIso = lecture.date;
    } else {
      const d = new Date();
      if (dateOffset === "tomorrow") d.setDate(d.getDate() + 1);
      if (dateOffset === "week") d.setDate(d.getDate() + 7);
      d.setHours(10, 0, 0, 0);
      dateIso = d.toISOString();
    }
    const dur = parseInt(duration, 10);
    onSave({
      title: title.trim(),
      notes: notes.trim() || undefined,
      location: location.trim() || undefined,
      subjectId,
      important,
      durationMinutes: Number.isFinite(dur) && dur > 0 ? dur : undefined,
      date: dateIso,
    });
  };

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ width: "100%" }}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
                {lecture ? "تعديل المحاضرة" : "محاضرة جديدة"}
              </Text>

              <Text style={[styles.modalLabel, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                العنوان
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="مثلاً: محاضرة الخوارزميات"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.modalInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border, fontFamily: arabicFont }]}
              />

              {/* Date */}
              {!lecture && (
                <>
                  <Text style={[styles.modalLabel, { color: colors.mutedForeground, fontFamily: arabicFont, marginTop: 12 }]}>
                    التاريخ
                  </Text>
                  <View style={styles.modalChipsRow}>
                    {([
                      { v: "today", label: "اليوم" },
                      { v: "tomorrow", label: "غداً" },
                      { v: "week", label: "بعد أسبوع" },
                    ] as const).map((opt) => {
                      const active = dateOffset === opt.v;
                      return (
                        <Pressable
                          key={opt.v}
                          onPress={() => setDateOffset(opt.v)}
                          style={[styles.modalChip, { backgroundColor: active ? colors.foreground : colors.surface, borderColor: active ? colors.foreground : colors.border }]}
                        >
                          <Text style={[styles.modalChipText, { color: active ? colors.background : colors.foreground, fontFamily: active ? arabicFontBold : arabicFont }]}>
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Subject */}
              {subjects.length > 0 && (
                <>
                  <Text style={[styles.modalLabel, { color: colors.mutedForeground, fontFamily: arabicFont, marginTop: 12 }]}>
                    المادة
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modalChipsRow}>
                    {subjects.map((s) => {
                      const active = subjectId === s.id;
                      return (
                        <Pressable
                          key={s.id}
                          onPress={() => setSubjectId(active ? undefined : s.id)}
                          style={[styles.modalChip, { backgroundColor: active ? colors.foreground : colors.surface, borderColor: active ? colors.foreground : colors.border }]}
                        >
                          <Text style={[styles.modalChipText, { color: active ? colors.background : colors.foreground, fontFamily: active ? arabicFontBold : arabicFont }]}>
                            {s.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              <Text style={[styles.modalLabel, { color: colors.mutedForeground, fontFamily: arabicFont, marginTop: 12 }]}>
                المكان
              </Text>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="قاعة 204"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.modalInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border, fontFamily: arabicFont }]}
              />

              <Text style={[styles.modalLabel, { color: colors.mutedForeground, fontFamily: arabicFont, marginTop: 12 }]}>
                المدة (بالدقائق)
              </Text>
              <TextInput
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholder="50"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.modalInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border, fontFamily: arabicFont }]}
              />

              <Text style={[styles.modalLabel, { color: colors.mutedForeground, fontFamily: arabicFont, marginTop: 12 }]}>
                ملاحظات
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                multiline
                placeholder="ملخّص أو نقاط مهمة..."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.modalInput, styles.modalNotes, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border, fontFamily: arabicFont }]}
              />

              <Pressable
                onPress={() => setImportant((v) => !v)}
                style={styles.importantRow}
              >
                <View style={[
                  styles.checkbox,
                  {
                    backgroundColor: important ? colors.foreground : "transparent",
                    borderColor: important ? colors.foreground : colors.border,
                  },
                ]}>
                  {important && <Feather name="check" size={14} color={colors.background} />}
                </View>
                <Text style={[{ color: colors.foreground, fontFamily: arabicFont, fontSize: 14 }]}>
                  ★ تمييز كمحاضرة مهمة
                </Text>
              </Pressable>

              <View style={styles.modalActions}>
                <Pressable
                  onPress={onClose}
                  style={[styles.modalBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
                >
                  <Text style={[styles.modalBtnText, { color: colors.foreground, fontFamily: arabicFontBold }]}>
                    إلغاء
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  disabled={!title.trim()}
                  style={[styles.modalBtn, { backgroundColor: title.trim() ? colors.foreground : colors.border, opacity: title.trim() ? 1 : 0.5 }]}
                >
                  <Text style={[styles.modalBtnText, { color: colors.background, fontFamily: arabicFontHeavy }]}>
                    حفظ
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chipsRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingTop: 6,
    paddingBottom: 12,
    flexDirection: "row-reverse",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: { fontSize: 13 },
  listScroll: { paddingHorizontal: 16, paddingTop: 6 },
  lecCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  lecRow: { flexDirection: "row-reverse", gap: 12, alignItems: "flex-start" },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  lecHeader: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  lecTitle: { fontSize: 16, textAlign: "right", flex: 1 },
  metaRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    flexWrap: "wrap",
  },
  metaText: { fontSize: 12 },
  notesText: { fontSize: 13, marginTop: 8, textAlign: "right", lineHeight: 20 },
  fab: {
    position: "absolute",
    bottom: 90,
    left: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "92%",
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalTitle: { fontSize: 20, textAlign: "right", marginBottom: 16 },
  modalLabel: { fontSize: 12, textAlign: "right", marginBottom: 6 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    textAlign: "right",
  },
  modalNotes: { minHeight: 80, textAlignVertical: "top" },
  modalChipsRow: { flexDirection: "row-reverse", gap: 8, flexWrap: "wrap" },
  modalChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  modalChipText: { fontSize: 13 },
  importantRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  modalActions: {
    flexDirection: "row-reverse",
    gap: 10,
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  modalBtnText: { fontSize: 14 },
});
