import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import { useColors } from "@/hooks/useColors";

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.foreground,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.surface2,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: isWeb ? 84 : undefined,
          paddingTop: 6,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface2 }]}
            />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "اليوم",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="sun" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="lectures"
        options={{
          title: "محاضرات",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="book-open" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "المهام",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="check-square" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: "كُميل",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="message-circle" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "أنا",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="user" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen name="voice" options={{ href: null }} />
    </Tabs>
  );
}

function TabIcon({
  name,
  color,
  focused,
}: {
  name: keyof typeof Feather.glyphMap;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={iconStyles.wrap}>
      <Feather name={name} size={focused ? 22 : 20} color={color} />
      {focused ? (
        <View style={[iconStyles.activeDot, { backgroundColor: color }]} />
      ) : (
        <View style={iconStyles.spacer} />
      )}
    </View>
  );
}

const iconStyles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  spacer: {
    width: 4,
    height: 4,
  },
});
