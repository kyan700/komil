import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { arabicFont, arabicFontBold, arabicFontHeavy } from "@/constants/typography";

interface Props {
  greeting: string;
  name: string;
  criticalCount: number;
  todayPct: number;
  todayCompleted: number;
  todayTotal: number;
  onStartNext: () => void;
  onReplan: () => void;
}

export function HeroCard({
  greeting,
  name,
  criticalCount,
  todayPct,
  todayCompleted,
  todayTotal,
  onStartNext,
  onReplan,
}: Props) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.greeting, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
          {greeting}، {name}
        </Text>
        {criticalCount > 0 ? (
          <View style={[styles.criticalChip, { borderColor: colors.foreground }]}>
            <Text style={[styles.criticalText, { color: colors.foreground, fontFamily: arabicFontBold }]}>
              {criticalCount} حرجة
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.scoreBlock}>
        <Text style={[styles.scoreLabel, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
          درجة اليوم
        </Text>
        <View style={styles.scoreRow}>
          <Text style={[styles.scoreNumber, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
            {todayPct}
            <Text style={[styles.scorePct, { color: colors.mutedForeground }]}>٪</Text>
          </Text>
          <Text style={[styles.scoreSub, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
            {todayCompleted} من {todayTotal}
          </Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.surface3 }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.foreground,
                width: `${todayPct}%`,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={onStartNext}
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: colors.foreground, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Feather name="play" size={16} color={colors.background} />
          <Text style={[styles.primaryBtnText, { color: colors.background, fontFamily: arabicFontBold }]}>
            ابدأ المهمة التالية
          </Text>
        </Pressable>
        <Pressable
          onPress={onReplan}
          style={({ pressed }) => [
            styles.ghostBtn,
            { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="refresh-cw" size={14} color={colors.foreground} />
          <Text style={[styles.ghostBtnText, { color: colors.foreground, fontFamily: arabicFontBold }]}>
            أعد التخطيط
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    gap: 22,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: {
    fontSize: 13,
  },
  criticalChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  criticalText: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
  scoreBlock: {
    gap: 10,
  },
  scoreLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
  },
  scoreNumber: {
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -1,
  },
  scorePct: {
    fontSize: 24,
  },
  scoreSub: {
    fontSize: 13,
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 14,
  },
  ghostBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  ghostBtnText: {
    fontSize: 13,
  },
});
