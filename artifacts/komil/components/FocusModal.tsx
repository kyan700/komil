import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { arabicFont, arabicFontBold, arabicFontHeavy } from "@/constants/typography";

interface Props {
  visible: boolean;
  onClose: () => void;
  taskTitle: string;
  initialMinutes: number;
  onComplete: (actualMinutes: number, interruptions: number) => void;
}

export function FocusModal({ visible, onClose, taskTitle, initialMinutes, onComplete }: Props) {
  const colors = useColors();
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (visible) {
      setSecondsLeft(initialMinutes * 60);
      setRunning(false);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible, initialMinutes]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const totalSeconds = initialMinutes * 60;
  const elapsed = totalSeconds - secondsLeft;
  const progress = totalSeconds > 0 ? elapsed / totalSeconds : 0;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const handleFinish = () => {
    const actualMinutes = Math.max(1, Math.round(elapsed / 60));
    onComplete(actualMinutes, 0);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
          <Feather name="x" size={24} color={colors.mutedForeground} />
        </Pressable>

        <View style={styles.body}>
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
            وضع التركيز
          </Text>
          <Text
            numberOfLines={2}
            style={[styles.taskTitle, { color: colors.foreground, fontFamily: arabicFontBold }]}
          >
            {taskTitle}
          </Text>

          <View style={styles.timerWrap}>
            <View
              style={[
                styles.ringBg,
                { borderColor: colors.surface3 },
              ]}
            />
            <View
              style={[
                styles.ringProgress,
                {
                  borderColor: colors.foreground,
                  transform: [{ rotate: `${progress * 360}deg` }],
                  opacity: progress > 0 ? 1 : 0,
                },
              ]}
            />
            <View style={styles.timerInner}>
              <Text style={[styles.timerText, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </Text>
              <Text style={[styles.timerSub, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                {running ? "جاري التركيز" : secondsLeft === 0 ? "انتهى الوقت" : "متوقف"}
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                setRunning((r) => !r);
              }}
              style={({ pressed }) => [
                styles.bigBtn,
                {
                  backgroundColor: colors.foreground,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Feather
                name={running ? "pause" : "play"}
                size={20}
                color={colors.background}
              />
              <Text style={[styles.bigBtnText, { color: colors.background, fontFamily: arabicFontBold }]}>
                {running ? "إيقاف مؤقت" : "ابدأ"}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleFinish}
              style={({ pressed }) => [
                styles.ghostBtn,
                { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text style={[styles.ghostBtnText, { color: colors.foreground, fontFamily: arabicFontBold }]}>
                إنهاء
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  closeBtn: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  label: {
    fontSize: 12,
    letterSpacing: 2,
  },
  taskTitle: {
    fontSize: 22,
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 32,
  },
  timerWrap: {
    width: 280,
    height: 280,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
  },
  ringBg: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 4,
  },
  ringProgress: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 4,
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
  },
  timerInner: {
    alignItems: "center",
    gap: 6,
  },
  timerText: {
    fontSize: 64,
    letterSpacing: -2,
    fontVariant: ["tabular-nums"],
  },
  timerSub: {
    fontSize: 12,
    letterSpacing: 2,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  bigBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 18,
    gap: 8,
  },
  bigBtnText: {
    fontSize: 15,
  },
  ghostBtn: {
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostBtnText: {
    fontSize: 14,
  },
});
