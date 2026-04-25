import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { arabicFont, arabicFontHeavy } from "@/constants/typography";

interface Props {
  title: string;
  subtitle?: string;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightPress?: () => void;
}

export function ScreenHeader({ title, subtitle, rightIcon, onRightPress }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webExtra = Platform.OS === "web" ? 24 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 + webExtra }]}>
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightIcon ? (
          <Pressable
            onPress={onRightPress}
            hitSlop={12}
            style={({ pressed }) => [
              styles.iconBtn,
              { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Feather name={rightIcon} size={18} color={colors.foreground} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 28,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
