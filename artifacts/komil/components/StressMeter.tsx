import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { arabicFontBold, arabicFont } from "@/constants/typography";

interface Props {
  ratio: number;
  label: string;
  level: "stable" | "loaded" | "tired" | "critical";
}

export function StressMeter({ ratio, label, level }: Props) {
  const colors = useColors();
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: ratio,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [ratio, width]);

  const color =
    level === "stable"
      ? colors.stressStable
      : level === "loaded"
        ? colors.stressLoaded
        : level === "tired"
          ? colors.stressTired
          : colors.stressCritical;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[styles.title, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
          مستوى الإجهاد
        </Text>
        <Text style={[styles.label, { color, fontFamily: arabicFontBold }]}>{label}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.surface3 }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: color,
              width: width.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 13,
    letterSpacing: 0.3,
  },
  track: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
});
