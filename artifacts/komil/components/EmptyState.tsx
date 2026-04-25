import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { arabicFont, arabicFontBold } from "@/constants/typography";

interface Props {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = "inbox", title, description, action }: Props) {
  const colors = useColors();
  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <View style={[styles.iconWrap, { borderColor: colors.border }]}>
        <Feather name={icon} size={22} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.title, { color: colors.foreground, fontFamily: arabicFontBold }]}>
        {title}
      </Text>
      {description ? (
        <Text style={[styles.desc, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
          {description}
        </Text>
      ) : null}
      {action ? <View style={styles.actionWrap}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 12,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    textAlign: "center",
  },
  desc: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 260,
  },
  actionWrap: {
    marginTop: 8,
  },
});
