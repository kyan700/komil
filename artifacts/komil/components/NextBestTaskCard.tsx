import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { arabicFont, arabicFontBold } from "@/constants/typography";
import type { DecisionScore } from "@/lib/decision";
import type { Subject } from "@/lib/types";

interface Props {
  decision: DecisionScore | null;
  subject?: Subject;
  onStart: () => void;
  onPostpone: () => void;
  onBreakdown: () => void;
}

export function NextBestTaskCard({ decision, subject, onStart, onPostpone, onBreakdown }: Props) {
  const colors = useColors();
  const [showWhy, setShowWhy] = useState(false);

  if (!decision) {
    return (
      <View style={[styles.empty, { borderColor: colors.border }]}>
        <Feather name="check-circle" size={28} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
          لا توجد مهام مفتوحة. اِنشئ مهمة جديدة لتبدأ.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <View style={styles.tagWrap}>
          <View style={[styles.dot, { backgroundColor: colors.foreground }]} />
          <Text style={[styles.tag, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
            أفضل مهمة الآن
          </Text>
        </View>
        {subject ? (
          <Text style={[styles.subjectText, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
            {subject.name}
          </Text>
        ) : null}
      </View>

      <Text style={[styles.title, { color: colors.foreground, fontFamily: arabicFontBold }]}>
        {decision.task.title}
      </Text>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={onStart}
          style={({ pressed }) => [
            styles.primary,
            { backgroundColor: colors.foreground, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Feather name="play" size={14} color={colors.background} />
          <Text style={[styles.primaryText, { color: colors.background, fontFamily: arabicFontBold }]}>
            ابدأ الآن
          </Text>
        </Pressable>
        <Pressable
          onPress={onBreakdown}
          style={({ pressed }) => [
            styles.iconBtn,
            { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="layers" size={16} color={colors.foreground} />
        </Pressable>
        <Pressable
          onPress={onPostpone}
          style={({ pressed }) => [
            styles.iconBtn,
            { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="clock" size={16} color={colors.foreground} />
        </Pressable>
        <Pressable
          onPress={() => setShowWhy((s) => !s)}
          style={({ pressed }) => [
            styles.iconBtn,
            { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="help-circle" size={16} color={colors.foreground} />
        </Pressable>
      </View>

      {showWhy ? (
        <View style={[styles.whyBlock, { borderColor: colors.border }]}>
          <Text style={[styles.whyTitle, { color: colors.mutedForeground, fontFamily: arabicFontBold }]}>
            لماذا هذه المهمة؟
          </Text>
          {decision.reasons.map((r) => (
            <View key={r} style={styles.whyItem}>
              <View style={[styles.whyDot, { backgroundColor: colors.mutedForeground }]} />
              <Text style={[styles.whyText, { color: colors.foreground, fontFamily: arabicFont }]}>
                {r}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  empty: {
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tagWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tag: {
    fontSize: 11,
    letterSpacing: 1,
  },
  subjectText: {
    fontSize: 12,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  primaryText: {
    fontSize: 13,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  whyBlock: {
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 8,
  },
  whyTitle: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  whyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  whyDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  whyText: {
    fontSize: 13,
  },
});
