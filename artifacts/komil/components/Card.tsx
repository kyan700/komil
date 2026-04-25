import React from "react";
import { StyleSheet, View, ViewProps, ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props extends ViewProps {
  variant?: "elevated" | "ghost" | "flat";
  padded?: boolean;
}

export function Card({
  style,
  variant = "elevated",
  padded = true,
  children,
  ...rest
}: Props) {
  const colors = useColors();

  const variantStyle: ViewStyle =
    variant === "elevated"
      ? {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        }
      : variant === "flat"
        ? {
            backgroundColor: colors.surface3,
            borderWidth: 0,
          }
        : {
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: colors.border,
          };

  return (
    <View
      style={[
        styles.base,
        { borderRadius: colors.radius },
        variantStyle,
        padded && styles.padded,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
  padded: {
    padding: 18,
  },
});
