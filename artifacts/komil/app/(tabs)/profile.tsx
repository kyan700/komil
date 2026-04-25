import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Logo } from "@/components/Logo";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useColors } from "@/hooks/useColors";
import { arabicFont, arabicFontBold, arabicFontHeavy } from "@/constants/typography";
import { useApp } from "@/store/AppContext";

export default function ProfileScreen() {
  const colors = useColors();
  const { tasks, focusSessions, streak, subjects } = useApp();

  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "done").length;
    const open = tasks.filter((t) => t.status !== "done" && t.status !== "archived").length;
    const focusMinutes = focusSessions.reduce((sum, s) => sum + s.actualMinutes, 0);
    const sessionCount = focusSessions.length;
    return { completed, open, focusMinutes, sessionCount };
  }, [tasks, focusSessions]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="ملفي" subtitle="إعدادات وإحصائيات أداء" rightIcon="settings" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { borderColor: colors.border }]}>
            <Text style={[styles.avatarText, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
              م
            </Text>
          </View>
          <View style={styles.heroBody}>
            <Text style={[styles.name, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
              معمر
            </Text>
            <Text style={[styles.bio, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
              طالب · {subjects.length} مادة · النسخة المجانية
            </Text>
          </View>
          <View style={[styles.streakBadge, { borderColor: colors.foreground }]}>
            <Feather name="zap" size={12} color={colors.foreground} />
            <Text style={[styles.streakText, { color: colors.foreground, fontFamily: arabicFontBold }]}>
              {streak}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="مهام مكتملة" value={String(stats.completed)} icon="check-circle" />
          <StatCard label="مهام مفتوحة" value={String(stats.open)} icon="circle" />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            label="دقائق تركيز"
            value={String(stats.focusMinutes)}
            icon="target"
          />
          <StatCard
            label="جلسات تركيز"
            value={String(stats.sessionCount)}
            icon="play"
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: arabicFontBold }]}>
            الإعدادات
          </Text>
          <SettingRow icon="bell" label="الإشعارات الذكية" value="مفعّلة" />
          <SettingRow icon="moon" label="الوضع الداكن" value="مفعّل دائماً" />
          <SettingRow icon="cloud" label="المزامنة" value="محلي فقط" />
          <SettingRow icon="lock" label="حماية البيانات" value="AES-256" />
          <SettingRow icon="globe" label="اللغة" value="العربية" />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: arabicFontBold }]}>
            النسخة الاحترافية
          </Text>
          <View style={styles.proRow}>
            <ProFeature label="غرفة الأزمات المتقدمة" />
            <ProFeature label="متنبئ الإرهاق الذكي" />
            <ProFeature label="مساحة تخزين لا محدودة" />
            <ProFeature label="تفكيك المهام السحابي" />
          </View>
        </View>

        <View style={styles.aboutSection}>
          <Logo size={64} />
          <Text style={[styles.appName, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
            كُميل
          </Text>
          <Text style={[styles.version, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
            النسخة 1.0.0 · Offline-First
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

function ProFeature({ label }: { label: string }) {
  const colors = useColors();
  return (
    <View style={styles.proRowItem}>
      <View style={[styles.proCheck, { borderColor: colors.foreground }]}>
        <Feather name="check" size={10} color={colors.foreground} />
      </View>
      <Text style={[styles.proLabel, { color: colors.foreground, fontFamily: arabicFont }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
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
  avatarText: {
    fontSize: 22,
  },
  heroBody: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 18,
  },
  bio: {
    fontSize: 12,
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
  streakText: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
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
  statValue: {
    fontSize: 24,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
  },
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
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 14,
  },
  settingValue: {
    fontSize: 12,
  },
  proRow: {
    gap: 10,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  proRowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  proCheck: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  proLabel: {
    fontSize: 13,
  },
  aboutSection: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  appName: {
    fontSize: 22,
    letterSpacing: 1,
    marginTop: 12,
  },
  version: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  divider: {
    width: 32,
    height: 1,
    marginVertical: 12,
  },
  signature: {
    fontSize: 11,
    letterSpacing: 1,
  },
  signatureName: {
    fontSize: 13,
    letterSpacing: 1,
  },
});
