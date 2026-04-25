import { Feather } from "@expo/vector-icons";
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
import type { ScheduleEventType, Subject } from "@/lib/types";

interface Props {
  visible: boolean;
  onClose: () => void;
  subjects: Subject[];
  onSubmit: (input: {
    title: string;
    type: ScheduleEventType;
    subjectId?: string;
    location?: string;
    weekday: number;
    hour: number;
    durationMinutes: number;
    daysFromNow: number;
  }) => void;
}

const TYPES: { value: ScheduleEventType; label: string }[] = [
  { value: "lecture", label: "محاضرة" },
  { value: "exam", label: "امتحان" },
  { value: "holiday", label: "إجازة" },
];

const WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const DURATIONS = [60, 90, 120, 180];

export function AddEventSheet({ visible, onClose, subjects, onSubmit }: Props) {
  const colors = useColors();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ScheduleEventType>("lecture");
  const [subjectId, setSubjectId] = useState<string | undefined>();
  const [location, setLocation] = useState("");
  const [weekday, setWeekday] = useState<number>(new Date().getDay());
  const [hour, setHour] = useState<number>(10);
  const [durationMinutes, setDurationMinutes] = useState<number>(90);
  const [daysFromNow, setDaysFromNow] = useState<number>(7);

  const reset = () => {
    setTitle("");
    setType("lecture");
    setSubjectId(undefined);
    setLocation("");
    setWeekday(new Date().getDay());
    setHour(10);
    setDurationMinutes(90);
    setDaysFromNow(7);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      type,
      subjectId,
      location: location.trim() || undefined,
      weekday,
      hour,
      durationMinutes,
      daysFromNow,
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
              حدث جديد في الجدول
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
                نوع الحدث
              </Text>
              <View style={styles.chipsRow}>
                {TYPES.map((t) => (
                  <Chip
                    key={t.value}
                    label={t.label}
                    active={type === t.value}
                    onPress={() => setType(t.value)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                العنوان
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={
                  type === "lecture"
                    ? "محاضرة..."
                    : type === "exam"
                      ? "امتحان نصفي..."
                      : "إجازة..."
                }
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

            {type !== "holiday" && subjects.length > 0 ? (
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                  المادة
                </Text>
                <View style={styles.chipsRow}>
                  <Chip label="بدون" active={!subjectId} onPress={() => setSubjectId(undefined)} />
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
            ) : null}

            {type === "lecture" ? (
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                  يوم الأسبوع
                </Text>
                <View style={styles.chipsRow}>
                  {WEEKDAYS.map((d, i) => (
                    <Chip key={d} label={d} active={weekday === i} onPress={() => setWeekday(i)} />
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                  بعد كم يوم
                </Text>
                <View style={styles.chipsRow}>
                  {[1, 3, 7, 14, 30].map((d) => (
                    <Chip
                      key={d}
                      label={d === 1 ? "غداً" : `${d} أيام`}
                      active={daysFromNow === d}
                      onPress={() => setDaysFromNow(d)}
                    />
                  ))}
                </View>
              </View>
            )}

            {type !== "holiday" ? (
              <>
                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                    الساعة
                  </Text>
                  <View style={styles.chipsRow}>
                    {HOURS.map((h) => (
                      <Chip
                        key={h}
                        label={`${h}:00`}
                        active={hour === h}
                        onPress={() => setHour(h)}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                    المدة (دقيقة)
                  </Text>
                  <View style={styles.chipsRow}>
                    {DURATIONS.map((d) => (
                      <Chip
                        key={d}
                        label={`${d}`}
                        active={durationMinutes === d}
                        onPress={() => setDurationMinutes(d)}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                    المكان (اختياري)
                  </Text>
                  <TextInput
                    value={location}
                    onChangeText={setLocation}
                    placeholder="قاعة..."
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
                  />
                </View>
              </>
            ) : null}
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
                حفظ في الجدول
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
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 15,
    textAlign: "right",
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
  },
});
