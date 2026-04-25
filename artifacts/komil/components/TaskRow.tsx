import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { arabicFont, arabicFontBold } from "@/constants/typography";
import type { Subject, Task } from "@/lib/types";

interface Props {
  task: Task;
  subject?: Subject;
  onComplete?: (id: string) => void;
  onPress?: (task: Task) => void;
}

function formatDue(due?: string): string {
  if (!due) return "بدون موعد";
  const d = new Date(due);
  const now = new Date();
  const diffH = (d.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (diffH < -24) return `متأخر ${Math.abs(Math.floor(diffH / 24))} يوم`;
  if (diffH < 0) return "متأخر";
  if (diffH < 1) return "خلال أقل من ساعة";
  if (diffH < 24) return `خلال ${Math.floor(diffH)} ساعة`;
  if (diffH < 48) return "غداً";
  return `خلال ${Math.ceil(diffH / 24)} أيام`;
}

export function TaskRow({ task, subject, onComplete, onPress }: Props) {
  const colors = useColors();
  const isDone = task.status === "done";
  const isCritical = task.priority === "critical";
  const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < Date.now() && !isDone;

  return (
    <Pressable
      onPress={() => onPress?.(task)}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Pressable
        hitSlop={12}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onComplete?.(task.id);
        }}
        style={[
          styles.checkbox,
          {
            borderColor: isDone ? colors.foreground : colors.border,
            backgroundColor: isDone ? colors.foreground : "transparent",
          },
        ]}
      >
        {isDone ? <Feather name="check" size={14} color={colors.background} /> : null}
      </Pressable>

      <View style={styles.body}>
        <Text
          numberOfLines={2}
          style={[
            styles.title,
            {
              color: isDone ? colors.mutedForeground : colors.foreground,
              fontFamily: arabicFontBold,
              textDecorationLine: isDone ? "line-through" : "none",
            },
          ]}
        >
          {task.title}
        </Text>
        <View style={styles.metaRow}>
          {subject ? (
            <View style={styles.metaItem}>
              <View style={[styles.dot, { backgroundColor: subject.shade }]} />
              <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                {subject.name}
              </Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Feather name="clock" size={11} color={isOverdue ? colors.destructive : colors.mutedForeground} />
            <Text
              style={[
                styles.metaText,
                {
                  color: isOverdue ? colors.destructive : colors.mutedForeground,
                  fontFamily: arabicFont,
                },
              ]}
            >
              {formatDue(task.dueDate)}
            </Text>
          </View>
          {task.estimatedMinutes ? (
            <View style={styles.metaItem}>
              <Feather name="zap" size={11} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                {task.estimatedMinutes} د
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {isCritical && !isDone ? (
        <View style={[styles.priorityBadge, { borderColor: colors.foreground }]}>
          <Text style={[styles.priorityText, { color: colors.foreground, fontFamily: arabicFontBold }]}>
            حرج
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  body: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 15,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 11,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
