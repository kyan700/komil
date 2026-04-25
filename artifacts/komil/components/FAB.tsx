import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface Props {
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
}

export function FAB({ onPress, icon = "plus" }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webBottom = Platform.OS === "web" ? 100 : 90;
  const bottom = Platform.OS === "ios" ? 100 + insets.bottom * 0.4 : webBottom;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.fab,
        {
          bottom,
          backgroundColor: colors.foreground,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      <Feather name={icon} size={24} color={colors.background} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
});
