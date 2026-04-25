import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

import { Logo } from "./Logo";

interface Props {
  onFinish: () => void;
}

export function SplashOverlay({ onFinish }: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const exitFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(exitFade, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => onFinish());
    }, 2200);

    return () => clearTimeout(timer);
  }, [fade, scale, exitFade, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: exitFade }]}>
      <Animated.View style={{ opacity: fade, transform: [{ scale }] }}>
        <Logo size={120} showSignature />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0A0A0A",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
});
