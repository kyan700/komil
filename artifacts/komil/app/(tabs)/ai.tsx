import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useColors } from "@/hooks/useColors";
import { arabicFont, arabicFontBold, arabicFontHeavy } from "@/constants/typography";
import { stressLevel } from "@/lib/decision";
import { useApp } from "@/store/AppContext";

export default function AIScreen() {
  const colors = useColors();
  const { inbox, tasks, schedule, addInboxItem, resolveInboxItem, deleteInboxItem } = useApp();

  const stress = useMemo(() => stressLevel(tasks), [tasks]);
  const isCrisis = stress.level === "tired" || stress.level === "critical";

  const upcomingExam = useMemo(() => {
    const exams = schedule
      .filter((e) => e.type === "exam" && new Date(e.startTime).getTime() > Date.now())
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    return exams[0];
  }, [schedule]);

  const examDays = upcomingExam
    ? Math.ceil((new Date(upcomingExam.startTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const triggerScan = (label: string) => {
    Haptics.selectionAsync().catch(() => {});
    addInboxItem({
      text: `تم استخراج عنصر من ${label} — جاهز للمراجعة`,
      source: label === "المسح الضوئي" ? "scan" : "manual",
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="مركز الذكاء" subtitle="مستشارك الأكاديمي الخصوصي" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isCrisis ? (
          <View style={[styles.crisisCard, { borderColor: colors.foreground }]}>
            <View style={styles.crisisHeader}>
              <Feather name="alert-triangle" size={18} color={colors.foreground} />
              <Text style={[styles.crisisTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
                غرفة الأزمات نشطة
              </Text>
            </View>
            <Text style={[styles.crisisDesc, { color: colors.textSecondary, fontFamily: arabicFont }]}>
              لاحظت تكدس المهام. هذا اقتراح لإنقاذ أسبوعك:
            </Text>
            <View style={styles.crisisActions}>
              <CrisisAction icon="layers" label="فكك أكبر 3 مهام" />
              <CrisisAction icon="clock" label="أجّل المهام منخفضة الأولوية" />
              <CrisisAction icon="moon" label="احجز ليلة راحة الأربعاء" />
            </View>
          </View>
        ) : (
          <View style={[styles.zenCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.zenIcon, { borderColor: colors.border }]}>
              <Feather name="cloud" size={20} color={colors.foreground} />
            </View>
            <View style={styles.zenBody}>
              <Text style={[styles.zenTitle, { color: colors.foreground, fontFamily: arabicFontBold }]}>
                وضعك الأكاديمي مستقر
              </Text>
              <Text style={[styles.zenDesc, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                لا تدخلات مطلوبة الآن. غرفة الأزمات ستفعّل تلقائياً عند الحاجة.
              </Text>
            </View>
          </View>
        )}

        {examDays !== null && examDays <= 14 ? (
          <View style={[styles.predictorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.predictorHeader}>
              <Text style={[styles.predictorLabel, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                خطة مراجعة مقترحة
              </Text>
              <View style={[styles.predictorBadge, { borderColor: colors.foreground }]}>
                <Text style={[styles.predictorBadgeText, { color: colors.foreground, fontFamily: arabicFontBold }]}>
                  {examDays} يوم
                </Text>
              </View>
            </View>
            <Text style={[styles.predictorTitle, { color: colors.foreground, fontFamily: arabicFontBold }]}>
              {upcomingExam?.title}
            </Text>
            <View style={styles.planSteps}>
              <PlanStep step="١" label="مراجعة سريعة للملخصات" days={examDays - 7} />
              <PlanStep step="٢" label="حل تمارين سابقة" days={examDays - 3} />
              <PlanStep step="٣" label="مراجعة نهائية مكثفة" days={1} />
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
            محركات الذكاء
          </Text>
          <View style={styles.engineGrid}>
            <EngineCard
              icon="camera"
              title="ماسح المنهج"
              desc="صوّر منهجك وحوله لمهام"
              onPress={() => triggerScan("المسح الضوئي")}
            />
            <EngineCard
              icon="zap"
              title="تفكيك المهام"
              desc="قسّم المهام الكبيرة لخطوات"
              onPress={() => triggerScan("التفكيك")}
            />
            <EngineCard
              icon="trending-down"
              title="متنبئ الإرهاق"
              desc="حلل حالتك واقترح راحة"
              onPress={() => triggerScan("متنبئ الإرهاق")}
            />
            <EngineCard
              icon="target"
              title="المهمة التالية"
              desc="قرار ذكي لما تفعله الآن"
              onPress={() => triggerScan("محرك القرار")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
              صندوق الوارد الذكي
            </Text>
            <Text style={[styles.sectionMeta, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
              {inbox.filter((i) => !i.resolved).length} عنصر للمراجعة
            </Text>
          </View>
          {inbox.length === 0 ? (
            <EmptyState
              icon="inbox"
              title="صندوق الوارد فارغ"
              description="استخراجات الصوت والمسح ستظهر هنا"
            />
          ) : (
            <View style={styles.inboxList}>
              {inbox.slice(0, 8).map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.inboxCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: item.resolved ? 0.55 : 1,
                    },
                  ]}
                >
                  <View style={[styles.inboxIcon, { borderColor: colors.border }]}>
                    <Feather
                      name={item.source === "voice" ? "mic" : item.source === "scan" ? "camera" : "edit-3"}
                      size={13}
                      color={colors.foreground}
                    />
                  </View>
                  <Text
                    style={[styles.inboxText, { color: colors.foreground, fontFamily: arabicFont }]}
                    numberOfLines={2}
                  >
                    {item.text}
                  </Text>
                  <View style={styles.inboxActions}>
                    {!item.resolved ? (
                      <Pressable
                        onPress={() => resolveInboxItem(item.id)}
                        hitSlop={10}
                        style={({ pressed }) => [styles.smallIcon, { opacity: pressed ? 0.5 : 1 }]}
                      >
                        <Feather name="check" size={14} color={colors.foreground} />
                      </Pressable>
                    ) : null}
                    <Pressable
                      onPress={() => deleteInboxItem(item.id)}
                      hitSlop={10}
                      style={({ pressed }) => [styles.smallIcon, { opacity: pressed ? 0.5 : 1 }]}
                    >
                      <Feather name="x" size={14} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

function EngineCard({
  icon,
  title,
  desc,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  desc: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.engineCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={[styles.engineIcon, { borderColor: colors.border }]}>
        <Feather name={icon} size={16} color={colors.foreground} />
      </View>
      <Text style={[styles.engineTitle, { color: colors.foreground, fontFamily: arabicFontBold }]}>
        {title}
      </Text>
      <Text style={[styles.engineDesc, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
        {desc}
      </Text>
    </Pressable>
  );
}

function CrisisAction({
  icon,
  label,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.crisisActionRow}>
      <View style={[styles.crisisActionIcon, { borderColor: colors.foreground }]}>
        <Feather name={icon} size={12} color={colors.foreground} />
      </View>
      <Text style={[styles.crisisActionText, { color: colors.foreground, fontFamily: arabicFont }]}>
        {label}
      </Text>
    </View>
  );
}

function PlanStep({ step, label, days }: { step: string; label: string; days: number }) {
  const colors = useColors();
  return (
    <View style={styles.planStep}>
      <View style={[styles.planStepNum, { borderColor: colors.foreground }]}>
        <Text style={[styles.planStepNumText, { color: colors.foreground, fontFamily: arabicFontBold }]}>
          {step}
        </Text>
      </View>
      <View style={styles.planStepBody}>
        <Text style={[styles.planStepLabel, { color: colors.foreground, fontFamily: arabicFontBold }]}>
          {label}
        </Text>
        <Text style={[styles.planStepDays, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
          {days <= 0 ? "ابدأ اليوم" : `بعد ${days} ${days === 1 ? "يوم" : "أيام"}`}
        </Text>
      </View>
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
  crisisCard: {
    padding: 20,
    borderRadius: 22,
    borderWidth: 1.5,
    gap: 14,
  },
  crisisHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  crisisTitle: {
    fontSize: 17,
  },
  crisisDesc: {
    fontSize: 13,
    lineHeight: 20,
  },
  crisisActions: {
    gap: 10,
    marginTop: 4,
  },
  crisisActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  crisisActionIcon: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  crisisActionText: {
    fontSize: 13,
  },
  zenCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  zenIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  zenBody: {
    flex: 1,
    gap: 4,
  },
  zenTitle: {
    fontSize: 14,
  },
  zenDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  predictorCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  predictorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  predictorLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  predictorBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  predictorBadgeText: {
    fontSize: 11,
  },
  predictorTitle: {
    fontSize: 16,
  },
  planSteps: {
    gap: 12,
    marginTop: 6,
  },
  planStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  planStepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  planStepNumText: {
    fontSize: 12,
  },
  planStepBody: {
    flex: 1,
    gap: 2,
  },
  planStepLabel: {
    fontSize: 13,
  },
  planStepDays: {
    fontSize: 11,
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
  engineGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  engineCard: {
    flexBasis: "48%",
    flexGrow: 1,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  engineIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  engineTitle: {
    fontSize: 14,
  },
  engineDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  inboxList: {
    gap: 8,
  },
  inboxCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  inboxIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  inboxText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  inboxActions: {
    flexDirection: "row",
    gap: 4,
  },
  smallIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
