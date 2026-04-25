import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useColors } from "@/hooks/useColors";
import { arabicFont, arabicFontBold, arabicFontHeavy } from "@/constants/typography";
import { useApp } from "@/store/AppContext";

export default function VoiceScreen() {
  const colors = useColors();
  const { inbox, addInboxItem, resolveInboxItem, deleteInboxItem } = useApp();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;

  const voiceInbox = inbox.filter((i) => i.source === "voice");

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (recording) {
      interval = setInterval(() => setSeconds((s) => s + 1), 1000);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recording, pulse]);

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    if (recording) {
      const minutes = Math.floor(seconds / 60);
      const remSec = seconds % 60;
      const dur = `${minutes}:${remSec.toString().padStart(2, "0")}`;
      addInboxItem({
        text: `تسجيل صوتي بمدة ${dur} — جاهز للمراجعة في صندوق الوارد الذكي`,
        source: "voice",
      });
      setSeconds(0);
    }
    setRecording((r) => !r);
  };

  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="المسجل" subtitle="التقاط سريع للأفكار والمحاضرات" />

      <View style={styles.recorderArea}>
        <Text style={[styles.timer, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
          {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
        </Text>
        <Text style={[styles.timerLabel, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
          {recording ? "جاري التسجيل" : "اضغط للبدء"}
        </Text>

        <Animated.View style={{ transform: [{ scale: pulse }], marginTop: 32 }}>
          <Pressable
            onPress={toggle}
            style={({ pressed }) => [
              styles.recordBtn,
              {
                backgroundColor: recording ? colors.destructive : colors.foreground,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather
              name={recording ? "square" : "mic"}
              size={36}
              color={recording ? colors.destructiveForeground : colors.background}
            />
          </Pressable>
        </Animated.View>

        <Text style={[styles.hint, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
          المسجل يعمل أوفلاين. سيتم استخراج النص محلياً قبل اعتماده.
        </Text>
      </View>

      <View style={styles.listSection}>
        <Text style={[styles.listTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
          آخر التسجيلات
        </Text>

        <ScrollView contentContainerStyle={styles.listScroll} showsVerticalScrollIndicator={false}>
          {voiceInbox.length === 0 ? (
            <EmptyState
              icon="mic"
              title="لا توجد تسجيلات بعد"
              description="ابدأ التسجيل وستظهر هنا للمراجعة"
            />
          ) : (
            voiceInbox.map((item) => (
              <View
                key={item.id}
                style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.itemIcon, { borderColor: colors.border }]}>
                  <Feather name="mic" size={14} color={colors.foreground} />
                </View>
                <View style={styles.itemBody}>
                  <Text
                    style={[styles.itemText, { color: colors.foreground, fontFamily: arabicFont }]}
                    numberOfLines={2}
                  >
                    {item.text}
                  </Text>
                  <Text style={[styles.itemMeta, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                    {new Date(item.createdAt).toLocaleString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "numeric",
                      month: "short",
                    })}
                    {item.resolved ? " · تمت المعالجة" : ""}
                  </Text>
                </View>
                <View style={styles.itemActions}>
                  {!item.resolved ? (
                    <Pressable
                      onPress={() => resolveInboxItem(item.id)}
                      hitSlop={10}
                      style={({ pressed }) => [styles.itemAction, { opacity: pressed ? 0.5 : 1 }]}
                    >
                      <Feather name="check" size={16} color={colors.foreground} />
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() => deleteInboxItem(item.id)}
                    hitSlop={10}
                    style={({ pressed }) => [styles.itemAction, { opacity: pressed ? 0.5 : 1 }]}
                  >
                    <Feather name="trash-2" size={16} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              </View>
            ))
          )}
          <View style={{ height: 120 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  recorderArea: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 4,
  },
  timer: {
    fontSize: 56,
    letterSpacing: -1,
    fontVariant: ["tabular-nums"],
  },
  timerLabel: {
    fontSize: 13,
    letterSpacing: 1,
  },
  recordBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  hint: {
    fontSize: 11,
    marginTop: 24,
    paddingHorizontal: 32,
    textAlign: "center",
    lineHeight: 18,
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 14,
  },
  listTitle: {
    fontSize: 16,
  },
  listScroll: {
    gap: 10,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  itemBody: {
    flex: 1,
    gap: 4,
  },
  itemText: {
    fontSize: 13,
    lineHeight: 20,
  },
  itemMeta: {
    fontSize: 10,
  },
  itemActions: {
    flexDirection: "row",
    gap: 4,
  },
  itemAction: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
