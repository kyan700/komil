import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
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
import { clearApiKey, loadApiKey } from "@/lib/ai";
import { useApp } from "@/store/AppContext";

export default function ProfileScreen() {
  const colors = useColors();
  const { tasks, focusSessions, streak, subjects, userName, setUserName } = useApp();
  const [editOpen, setEditOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(userName);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    setNameDraft(userName);
  }, [userName]);

  useEffect(() => {
    let cancelled = false;
    loadApiKey().then((k) => {
      if (!cancelled) setHasKey(!!k);
    });
    return () => {
      cancelled = true;
    };
  }, [editOpen]);

  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "done").length;
    const open = tasks.filter((t) => t.status !== "done" && t.status !== "archived").length;
    const focusMinutes = focusSessions.reduce((sum, s) => sum + s.actualMinutes, 0);
    const sessionCount = focusSessions.length;
    return { completed, open, focusMinutes, sessionCount };
  }, [tasks, focusSessions]);

  const avatarInitial = userName ? userName.trim().charAt(0) : "؟";
  const displayName = userName || "اضغط لإدخال اسمك";

  const onSaveName = () => {
    setUserName(nameDraft);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setEditOpen(false);
  };

  const onRemoveKey = () => {
    Alert.alert("حذف مفتاح الذكاء", "سيُحذف من القفل الآمن للجهاز.", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          await clearApiKey();
          setHasKey(false);
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="ملفي" subtitle="إعدادات وإحصائيات أداء" rightIcon="settings" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={() => setEditOpen(true)}
          style={({ pressed }) => [
            styles.heroCard,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View style={[styles.avatar, { borderColor: colors.border }]}>
            <Text style={[styles.avatarText, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
              {avatarInitial}
            </Text>
          </View>
          <View style={styles.heroBody}>
            <Text
              style={[
                styles.name,
                {
                  color: userName ? colors.foreground : colors.mutedForeground,
                  fontFamily: arabicFontHeavy,
                },
              ]}
            >
              {displayName}
            </Text>
            <Text style={[styles.bio, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
              طالب · {subjects.length} مادة · النسخة المجانية
            </Text>
          </View>
          <View style={[styles.editIcon, { borderColor: colors.border }]}>
            <Feather name="edit-2" size={12} color={colors.mutedForeground} />
          </View>
          <View style={[styles.streakBadge, { borderColor: colors.foreground }]}>
            <Feather name="zap" size={12} color={colors.foreground} />
            <Text style={[styles.streakText, { color: colors.foreground, fontFamily: arabicFontBold }]}>
              {streak}
            </Text>
          </View>
        </Pressable>

        <View style={styles.statsRow}>
          <StatCard label="مهام مكتملة" value={String(stats.completed)} icon="check-circle" />
          <StatCard label="مهام مفتوحة" value={String(stats.open)} icon="circle" />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="دقائق تركيز" value={String(stats.focusMinutes)} icon="target" />
          <StatCard label="جلسات تركيز" value={String(stats.sessionCount)} icon="play" />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: arabicFontBold }]}>
            الذكاء الاصطناعي
          </Text>
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingLeft}>
              <Feather name="lock" size={16} color={colors.foreground} />
              <Text style={[styles.settingLabel, { color: colors.foreground, fontFamily: arabicFontBold }]}>
                مفتاح الذكاء (komil_ai)
              </Text>
            </View>
            <Text style={[styles.settingValue, { color: hasKey ? colors.foreground : colors.mutedForeground, fontFamily: arabicFont }]}>
              {hasKey ? "مفعّل" : "غير مضبوط"}
            </Text>
          </View>
          {hasKey ? (
            <Pressable
              onPress={onRemoveKey}
              style={({ pressed }) => [styles.dangerBtn, { borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}
            >
              <Feather name="trash-2" size={12} color={colors.mutedForeground} />
              <Text style={[styles.dangerBtnText, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                حذف المفتاح من القفل الآمن
              </Text>
            </Pressable>
          ) : (
            <Text style={[styles.hint, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
              اذهب لتبويب «مركز الذكاء» لإضافة المفتاح.
            </Text>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: arabicFontBold }]}>
            الإعدادات
          </Text>
          <SettingRow icon="bell" label="الإشعارات الذكية" value="مفعّلة" />
          <SettingRow icon="moon" label="الوضع الداكن" value="مفعّل دائماً" />
          <SettingRow icon="cloud" label="المزامنة" value="محلي فقط" />
          <SettingRow icon="shield" label="حماية البيانات" value="القفل الآمن للجهاز" />
          <SettingRow icon="globe" label="اللغة" value="العربية" />
        </View>

        <View style={styles.aboutSection}>
          <Logo size={64} />
          <Text style={[styles.appName, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
            كُميل
          </Text>
          <Text style={[styles.version, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
            النسخة 1.1.0 · Offline-First
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.signature, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
            تصميم وتطوير
          </Text>
          <Text style={[styles.signatureName, { color: colors.foreground, fontFamily: arabicFontBold }]}>
            hmza Fahd
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setEditOpen(false)}>
          <Pressable
            onPress={() => {}}
            style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
              اسمك
            </Text>
            <Text style={[styles.modalDesc, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
              سنناديك به في صفحة اليوم.
            </Text>
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="أدخل اسمك"
              placeholderTextColor={colors.mutedForeground}
              autoFocus
              style={[
                styles.modalInput,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                  fontFamily: arabicFont,
                  backgroundColor: colors.background,
                },
              ]}
            />
            <View style={styles.modalRow}>
              <Pressable
                onPress={() => setEditOpen(false)}
                style={({ pressed }) => [styles.modalBtn, { borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.mutedForeground, fontFamily: arabicFontBold }]}>
                  إلغاء
                </Text>
              </Pressable>
              <Pressable
                onPress={onSaveName}
                style={({ pressed }) => [
                  styles.modalBtnPrimary,
                  { backgroundColor: colors.foreground, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.modalBtnText, { color: colors.background, fontFamily: arabicFontBold }]}>
                  حفظ
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
}) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { borderColor: colors.border }]}>
        <Feather name={icon} size={14} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
        {label}
      </Text>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <View style={styles.settingLeft}>
        <Feather name={icon} size={16} color={colors.foreground} />
        <Text style={[styles.settingLabel, { color: colors.foreground, fontFamily: arabicFontBold }]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.settingValue, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 16 },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 22 },
  heroBody: { flex: 1, gap: 4 },
  name: { fontSize: 18 },
  bio: { fontSize: 12 },
  editIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  streakText: { fontSize: 12 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 24, letterSpacing: -0.5 },
  statLabel: { fontSize: 11 },
  section: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingLabel: { fontSize: 14 },
  settingValue: { fontSize: 12 },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  dangerBtnText: { fontSize: 11 },
  hint: { fontSize: 11, paddingHorizontal: 4, paddingVertical: 6 },
  aboutSection: { alignItems: "center", paddingVertical: 32, gap: 8 },
  appName: { fontSize: 22, letterSpacing: 1, marginTop: 12 },
  version: { fontSize: 11, letterSpacing: 0.5 },
  divider: { width: 32, height: 1, marginVertical: 12 },
  signature: { fontSize: 11, letterSpacing: 1 },
  signatureName: { fontSize: 13, letterSpacing: 1 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    gap: 12,
  },
  modalTitle: { fontSize: 18 },
  modalDesc: { fontSize: 12, lineHeight: 18 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    textAlign: "right",
  },
  modalRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  modalBtnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnText: { fontSize: 13 },
});
