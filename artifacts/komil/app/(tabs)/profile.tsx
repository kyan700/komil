import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Logo } from "@/components/Logo";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useColors } from "@/hooks/useColors";
import { arabicFont, arabicFontBold, arabicFontHeavy } from "@/constants/typography";
import { clearApiKey, isEnvKey, loadApiKey } from "@/lib/ai";
import { useApp } from "@/store/AppContext";

type EditField = "name" | "university" | "major" | "level" | null;

export default function ProfileScreen() {
  const colors = useColors();
  const {
    tasks,
    focusSessions,
    streak,
    subjects,
    lectures,
    userName,
    university,
    major,
    level,
    setUserName,
    setUniversity,
    setMajor,
    setLevel,
  } = useApp();

  const [editField, setEditField] = useState<EditField>(null);
  const [draft, setDraft] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const baked = isEnvKey();

  useEffect(() => {
    let cancelled = false;
    loadApiKey().then((k) => {
      if (!cancelled) setHasKey(!!k);
    });
    return () => { cancelled = true; };
  }, [editField]);

  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "done").length;
    const open = tasks.filter((t) => t.status !== "done" && t.status !== "archived").length;
    const focusMinutes = focusSessions.reduce((sum, s) => sum + s.actualMinutes, 0);
    const attended = lectures.filter((l) => l.attended).length;
    return { completed, open, focusMinutes, attended };
  }, [tasks, focusSessions, lectures]);

  const openEdit = (field: Exclude<EditField, null>) => {
    if (field === "name") setDraft(userName);
    if (field === "university") setDraft(university);
    if (field === "major") setDraft(major);
    if (field === "level") setDraft(level);
    setEditField(field);
  };

  const saveEdit = () => {
    if (editField === "name") setUserName(draft);
    if (editField === "university") setUniversity(draft);
    if (editField === "major") setMajor(draft);
    if (editField === "level") setLevel(draft);
    setEditField(null);
  };

  const removeKey = () => {
    Alert.alert(
      "حذف المفتاح",
      "سيُحذف المفتاح من مخزن الجهاز الآمن. هل تريد المتابعة؟",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف", style: "destructive",
          onPress: async () => {
            await clearApiKey();
            setHasKey(false);
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="ملفي" subtitle="حسابك وإعداداتك" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Identity card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.identityRow}>
            <View style={[styles.avatar, { backgroundColor: colors.foreground }]}>
              <Text style={[styles.avatarText, { color: colors.background, fontFamily: arabicFontHeavy }]}>
                {(userName || "؟").charAt(0)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Pressable onPress={() => openEdit("name")} hitSlop={6}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
                    {userName || "اضغط لتحديث الاسم"}
                  </Text>
                  <Feather name="edit-2" size={14} color={colors.mutedForeground} />
                </View>
              </Pressable>
              {(university || major || level) && (
                <Text style={[styles.identitySub, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                  {[major, level, university].filter(Boolean).join(" · ")}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.statsRow}>
          <StatTile colors={colors} value={stats.completed} label="مهام منجزة" icon="check" />
          <StatTile colors={colors} value={stats.open} label="مهام مفتوحة" icon="clock" />
        </View>
        <View style={styles.statsRow}>
          <StatTile colors={colors} value={stats.attended} label="حضور محاضرات" icon="book-open" />
          <StatTile colors={colors} value={streak} label="سلسلة" icon="zap" />
        </View>

        {/* Profile fields */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
          بياناتي
        </Text>
        <FieldRow colors={colors} label="الجامعة" value={university} icon="award" onPress={() => openEdit("university")} />
        <FieldRow colors={colors} label="التخصص" value={major} icon="layers" onPress={() => openEdit("major")} />
        <FieldRow colors={colors} label="المستوى" value={level} icon="trending-up" onPress={() => openEdit("level")} />

        {/* AI section */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: arabicFontHeavy, marginTop: 22 }]}>
          المساعد الذكي
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.kvRow}>
            <View style={styles.kvLeft}>
              <Feather name="cpu" size={16} color={colors.foreground} />
              <Text style={[styles.kvLabel, { color: colors.foreground, fontFamily: arabicFontBold }]}>
                حالة المفتاح
              </Text>
            </View>
            <Text style={[styles.kvValue, {
              color: hasKey ? colors.foreground : colors.mutedForeground,
              fontFamily: arabicFont,
            }]}>
              {baked && hasKey ? "مدمج في التطبيق ✓" : hasKey ? "مخزّن في القفل الآمن ✓" : "غير مهيّأ"}
            </Text>
          </View>
          {!baked && hasKey && (
            <Pressable onPress={removeKey} style={[styles.dangerBtn, { borderColor: colors.border }]}>
              <Feather name="trash-2" size={14} color={colors.foreground} />
              <Text style={[styles.dangerText, { color: colors.foreground, fontFamily: arabicFontBold }]}>
                حذف المفتاح من الجهاز
              </Text>
            </Pressable>
          )}
          {baked && (
            <Text style={[styles.note, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
              المفتاح مدمج في هذه النسخة، لا تحتاج لإدخال شيء.
            </Text>
          )}
        </View>

        {/* Subjects summary */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: arabicFontHeavy, marginTop: 22 }]}>
          المواد ({subjects.length})
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {subjects.length === 0 ? (
            <Text style={[styles.note, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
              لم تُضف أي مادة بعد.
            </Text>
          ) : (
            subjects.map((s) => (
              <Text key={s.id} style={[styles.subjLine, { color: colors.foreground, fontFamily: arabicFont }]}>
                · {s.name}{s.instructor ? ` — ${s.instructor}` : ""}
              </Text>
            ))
          )}
        </View>

        {/* Signature */}
        <View style={styles.signatureBox}>
          <Logo size={32} />
          <Text style={[styles.signature, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
            كُميل · من تطوير hmza Fahd
          </Text>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editField !== null} animationType="fade" transparent onRequestClose={() => setEditField(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
              {editField === "name" && "تعديل الاسم"}
              {editField === "university" && "تعديل الجامعة"}
              {editField === "major" && "تعديل التخصص"}
              {editField === "level" && "تعديل المستوى"}
            </Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="اكتب القيمة..."
              placeholderTextColor={colors.mutedForeground}
              autoFocus
              style={[styles.modalInput, {
                color: colors.foreground,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                fontFamily: arabicFont,
              }]}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setEditField(null)}
                style={[styles.modalBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.foreground, fontFamily: arabicFontBold }]}>
                  إلغاء
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                  saveEdit();
                }}
                style={[styles.modalBtn, { backgroundColor: colors.foreground }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.background, fontFamily: arabicFontHeavy }]}>
                  حفظ
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatTile({ colors, value, label, icon }: { colors: any; value: number; label: string; icon: any }) {
  return (
    <View style={[styles.statTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Feather name={icon} size={14} color={colors.mutedForeground} />
      <Text style={[styles.statValue, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
        {label}
      </Text>
    </View>
  );
}

function FieldRow({ colors, label, value, icon, onPress }: { colors: any; label: string; value: string; icon: any; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.fieldRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Feather name={icon} size={16} color={colors.mutedForeground} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
          {label}
        </Text>
        <Text style={[styles.fieldValue, { color: colors.foreground, fontFamily: arabicFontBold }]}>
          {value || "اضغط للتعديل"}
        </Text>
      </View>
      <Feather name="chevron-left" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 100 },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  identityRow: { flexDirection: "row-reverse", alignItems: "center", gap: 14 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 22 },
  nameRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  name: { fontSize: 18, textAlign: "right" },
  identitySub: { fontSize: 12, textAlign: "right", marginTop: 4 },
  statsRow: { flexDirection: "row-reverse", gap: 10, marginBottom: 10 },
  statTile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "flex-start",
    gap: 4,
  },
  statValue: { fontSize: 22, marginTop: 2 },
  statLabel: { fontSize: 11 },
  sectionTitle: { fontSize: 15, textAlign: "right", marginTop: 18, marginBottom: 8 },
  fieldRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 8,
  },
  fieldLabel: { fontSize: 11, textAlign: "right" },
  fieldValue: { fontSize: 14, textAlign: "right", marginTop: 2 },
  kvRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", gap: 12 },
  kvLeft: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  kvLabel: { fontSize: 14 },
  kvValue: { fontSize: 13 },
  dangerBtn: {
    marginTop: 12,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  dangerText: { fontSize: 13 },
  note: { fontSize: 12, textAlign: "right", lineHeight: 18, marginTop: 8 },
  subjLine: { fontSize: 13, textAlign: "right", marginVertical: 2 },
  signatureBox: { alignItems: "center", marginTop: 30, gap: 8 },
  signature: { fontSize: 11, letterSpacing: 0.5 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 18, textAlign: "right", marginBottom: 14 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    textAlign: "right",
    marginBottom: 14,
  },
  modalActions: { flexDirection: "row-reverse", gap: 10 },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  modalBtnText: { fontSize: 14 },
});
