import * as Haptics from "expo-haptics";
import React from "react";
import {
  Pressable as RNPressable,
  PressableProps,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { arabicFontBold } from "@/constants/typography";

interface ButtonProps extends Omit<PressableProps, "style"> {
  label: string;
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  haptic?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  variant = "primary",
  size = "md",
  fullWidth,
  iconLeft,
  iconRight,
  haptic = true,
  onPress,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const colors = useColors();

  const handlePress = (e: Parameters<NonNullable<PressableProps["onPress"]>>[0]) => {
    if (haptic) Haptics.selectionAsync().catch(() => {});
    onPress?.(e);
  };

  const sizeStyle =
    size === "sm"
      ? { paddingVertical: 8, paddingHorizontal: 14, minHeight: 36 }
      : size === "lg"
        ? { paddingVertical: 16, paddingHorizontal: 22, minHeight: 56 }
        : { paddingVertical: 12, paddingHorizontal: 18, minHeight: 48 };

  const radius = size === "lg" ? 18 : 14;

  const variantBg =
    variant === "primary"
      ? colors.primary
      : variant === "secondary"
        ? colors.surface3
        : variant === "destructive"
          ? colors.destructive
          : "transparent";

  const variantBorder =
    variant === "ghost" ? colors.border : "transparent";

  const variantText =
    variant === "primary"
      ? colors.primaryForeground
      : variant === "destructive"
        ? colors.destructiveForeground
        : colors.foreground;

  return (
    <RNPressable
      {...rest}
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: variantBg,
          borderColor: variantBorder,
          borderWidth: variant === "ghost" ? 1 : 0,
          borderRadius: radius,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
          width: fullWidth ? "100%" : undefined,
        },
        sizeStyle,
        style,
      ]}
    >
      {iconLeft}
      <Text
        style={{
          color: variantText,
          fontFamily: arabicFontBold,
          fontSize: size === "lg" ? 16 : size === "sm" ? 13 : 15,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
      {iconRight}
    </RNPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
