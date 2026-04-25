import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { arabicFontHeavy } from "@/constants/typography";

interface LogoProps {
  size?: number;
  showSignature?: boolean;
  tone?: "light" | "dark";
}

export function Logo({ size = 120, showSignature = false, tone = "light" }: LogoProps) {
  const fg = tone === "light" ? "#FAFAFA" : "#0A0A0A";
  const bg = tone === "light" ? "#0A0A0A" : "#FAFAFA";
  const accent = tone === "light" ? "#FAFAFA" : "#0A0A0A";

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Circle cx="60" cy="60" r="58" fill={bg} stroke={fg} strokeWidth="1.5" />
        <Circle cx="60" cy="60" r="44" fill="none" stroke={fg} strokeOpacity="0.18" strokeWidth="1" />
        <Path
          d="M 38 30 L 38 90"
          stroke={fg}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Path
          d="M 38 60 L 80 30"
          stroke={fg}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Path
          d="M 38 60 L 80 90"
          stroke={fg}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Circle cx="38" cy="60" r="4" fill={accent} />
        <Circle cx="80" cy="30" r="3" fill={accent} />
        <Circle cx="80" cy="90" r="3" fill={accent} />
      </Svg>
      {showSignature && (
        <View style={styles.signatureWrap}>
          <Text style={[styles.brandName, { color: fg, fontFamily: arabicFontHeavy }]}>
            كُميل
          </Text>
          <View style={[styles.divider, { backgroundColor: fg, opacity: 0.2 }]} />
          <Text style={[styles.signature, { color: fg, opacity: 0.5 }]}>
            by hmza Fahd
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  signatureWrap: {
    marginTop: 18,
    alignItems: "center",
    gap: 8,
  },
  brandName: {
    fontSize: 28,
    letterSpacing: 1,
  },
  divider: {
    width: 32,
    height: 1,
  },
  signature: {
    fontSize: 11,
    letterSpacing: 3,
    fontStyle: "italic",
  },
});
