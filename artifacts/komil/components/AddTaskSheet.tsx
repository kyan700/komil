import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
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

import { useColors } from "@/hooks/useColors";
import { arabicFont, arabicFontBold } from "@/constants/typography";
import type { Subject, TaskPriority } from "@/lib/types";

interface Props {
  visible: boolean;
  onClose: () => void;
  subjects: Subject[];
  onSubmit: (input: {
    title: string;
    notes?: string;
    subjectId?: string;
    estimatedMinutes?: number;
    priority: TaskPriority;
    dueOffset: "today" | "tomorrow" | "week" | "none";
  }) => void;
}

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "منخفضة" },
  { value: "normal", label: "عادية" },
  { value: "high", label: "عالية" },
  { value: "critical", label: "حرجة" },
];

const DUE_OPTIONS: { value: "today" | "tomorrow" | "week" | "none"; label: string }[] = [
  { value: "today", label: "اليوم" },
  { value: "tomorrow", label: "غداً" },
  { value: "week", label: "خلال أسبوع" },
  { value: "none", label: "بدون موعد" },
];

const DURATION_OPTIONS = [15, 30, 60, 90, 120];

export function AddTaskSheet({ visible, onClose, subjects, onSubmit }: Props) {
  const colors = useColors();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [subjectId, setSubjectId] = useState<string | undefined>();
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [dueOffset, setDueOffset] = useState<"today" | "tomorrow" | "week" | "none">("today");
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>(60);

  const reset = () => {
    setTitle("");
    setNotes("");
    setSubjectId(undefined);
    setPriority("normal");
    setDueOffset("today");
    setEstimatedMinutes(60);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onSubmit({
      title: title.trim(),
      notes: notes.trim() || undefined,
      subjectId,
      priority,
      estimatedMinutes,
      dueOffset,
    });
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropTap} onPress={handleClose} />
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.handle}>
            <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground, fontFamily: arabicFontBold }]}>
              مهمة جديدة
            </Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                عنوان المهمة
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="مثال: مراجعة الفصل الثالث"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface3,
                    color: colors.foreground,
                    borderColor: colors.border,
                    fontFamily: arabicFont,
                  },
                ]}
                autoFocus
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                ملاحظات (اختياري)
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="تفاصيل إضافية..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                style={[
                  styles.input,
                  styles.multiline,
                  {
                    backgroundColor: colors.surface3,
                    color: colors.foreground,
                    borderColor: colors.border,
                    fontFamily: arabicFont,
                  },
                ]}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                المادة
              </Text>
              <View style={styles.chipsRow}>
                <Chip
                  label="بدون"
                  active={!subjectId}
                  onPress={() => setSubjectId(undefined)}
                />
                {subjects.map((s) => (
                  <Chip
                    key={s.id}
                    label={s.name}
                    active={subjectId === s.id}
                    onPress={() => setSubjectId(s.id)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                الأولوية
              </Text>
              <View style={styles.chipsRow}>
                {PRIORITIES.map((p) => (
                  <Chip
                    key={p.value}
                    label={p.label}
                    active={priority === p.value}
                    onPress={() => setPriority(p.value)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                موعد التسليم
              </Text>
              <View style={styles.chipsRow}>
                {DUE_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    active={dueOffset === opt.value}
                    onPress={() => setDueOffset(opt.value)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                المدة المتوقعة (دقيقة)
              </Text>
              <View style={styles.chipsRow}>
                {DURATION_OPTIONS.map((m) => (
                  <Chip
                    key={m}
                    label={`${m}`}
                    active={estimatedMinutes === m}
                    onPress={() => setEstimatedMinutes(m)}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              onPress={handleSubmit}
              disabled={!title.trim()}
              style={({ pressed }) => [
                styles.submitBtn,
                {
                  backgroundColor: colors.foreground,
                  opacity: !title.trim() ? 0.4 : pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={[styles.submitText, { color: colors.background, fontFamily: arabicFontBold }]}>
                حفظ المهمة
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.foreground : "transparent",
          borderColor: active ? colors.foreground : colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        style={{
          color: active ? colors.background : colors.foreground,
          fontFamily: arabicFontBold,
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  backdropTap: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    maxHeight: "85%",
  },
  handle: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
  },
  scroll: {
    maxHeight: 500,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 18,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 15,
    textAlign: "right",
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  footer: {
    padding: 18,
    borderTopWidth: 1,
  },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },
  submitText: {
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
