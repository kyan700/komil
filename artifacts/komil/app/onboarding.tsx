import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Logo } from "@/components/Logo";
import { useColors } from "@/hooks/useColors";
import { arabicFont, arabicFontBold, arabicFontHeavy } from "@/constants/typography";
import { useApp } from "@/store/AppContext";

const LEVELS = ["السنة الأولى", "السنة الثانية", "السنة الثالثة", "السنة الرابعة", "السنة الخامسة", "دراسات عُليا"];

export default function OnboardingScreen() {
  const colors = useColors();
  const { setUserName, setUniversity, setMajor, setLevel, setOnboarded } = useApp();

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [name, setName] = useState("");
  const [uni, setUni] = useState("");
  const [maj, setMaj] = useState("");
  const [lvl, setLvl] = useState<string>("");

  const canNext = (() => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return true; // university optional
    if (step === 2) return true;
    return false;
  })();

  const next = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    if (step < 2) {
      setStep((s) => (s + 1) as 0 | 1 | 2);
      return;
    }
    setUserName(name);
    setUniversity(uni);
    setMajor(maj);
    setLevel(lvl);
    setOnboarded(true);
  };

  const back = () => {
    if (step === 0) return;
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    setStep((s) => (s - 1) as 0 | 1 | 2);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand */}
          <View style={styles.brand}>
            <Logo size={56} />
            <Text style={[styles.brandTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
              كُميل
            </Text>
            <Text style={[styles.brandSub, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
              نظامك الأكاديمي الشخصي
            </Text>
          </View>

          {/* Progress */}
          <View style={styles.progressRow}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: i <= step ? colors.foreground : colors.border,
                    width: i === step ? 24 : 6,
                  },
                ]}
              />
            ))}
          </View>

          {/* Step 0: Name */}
          {step === 0 && (
            <View style={styles.stepCard}>
              <Text style={[styles.stepTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
                مرحباً بك
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                ما اسمك؟
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="مثلاً: عبدالله"
                placeholderTextColor={colors.mutedForeground}
                autoFocus
                style={[
                  styles.input,
                  {
                    color: colors.foreground,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    fontFamily: arabicFont,
                  },
                ]}
              />
            </View>
          )}

          {/* Step 1: University & Major */}
          {step === 1 && (
            <View style={styles.stepCard}>
              <Text style={[styles.stepTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
                دراستك
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                أخبرنا عن جامعتك (اختياري)
              </Text>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                الجامعة
              </Text>
              <TextInput
                value={uni}
                onChangeText={setUni}
                placeholder="مثلاً: جامعة الملك سعود"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  {
                    color: colors.foreground,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    fontFamily: arabicFont,
                  },
                ]}
              />
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: arabicFont, marginTop: 14 }]}>
                التخصص
              </Text>
              <TextInput
                value={maj}
                onChangeText={setMaj}
                placeholder="مثلاً: علوم حاسب"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  {
                    color: colors.foreground,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    fontFamily: arabicFont,
                  },
                ]}
              />
            </View>
          )}

          {/* Step 2: Level */}
          {step === 2 && (
            <View style={styles.stepCard}>
              <Text style={[styles.stepTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
                المستوى الدراسي
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                اختر سنتك (اختياري)
              </Text>
              <View style={styles.chipsWrap}>
                {LEVELS.map((l) => {
                  const active = lvl === l;
                  return (
                    <Pressable
                      key={l}
                      onPress={() => {
                        if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
                        setLvl(active ? "" : l);
                      }}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? colors.foreground : colors.surface,
                          borderColor: active ? colors.foreground : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: active ? colors.background : colors.foreground,
                            fontFamily: active ? arabicFontBold : arabicFont,
                          },
                        ]}
                      >
                        {l}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer buttons */}
        <View style={styles.footer}>
          {step > 0 && (
            <Pressable
              onPress={back}
              style={[styles.btnGhost, { borderColor: colors.border }]}
            >
              <Feather name="arrow-right" size={18} color={colors.foreground} />
              <Text style={[styles.btnGhostText, { color: colors.foreground, fontFamily: arabicFontBold }]}>
                السابق
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={next}
            disabled={!canNext}
            style={[
              styles.btnPrimary,
              {
                backgroundColor: canNext ? colors.foreground : colors.border,
                opacity: canNext ? 1 : 0.5,
              },
            ]}
          >
            <Text style={[styles.btnPrimaryText, { color: colors.background, fontFamily: arabicFontHeavy }]}>
              {step < 2 ? "التالي" : "ابدأ الآن"}
            </Text>
            <Feather name={step < 2 ? "arrow-left" : "check"} size={18} color={colors.background} />
          </Pressable>
        </View>

        <Text style={[styles.signature, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
          من تطوير hmza Fahd
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 24 },
  brand: { alignItems: "center", marginTop: 32, marginBottom: 24 },
  brandTitle: { fontSize: 32, marginTop: 14, letterSpacing: 0.5 },
  brandSub: { fontSize: 14, marginTop: 4 },
  progressRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginBottom: 28,
  },
  progressDot: { height: 6, borderRadius: 3 },
  stepCard: { marginTop: 8 },
  stepTitle: { fontSize: 24, textAlign: "right", marginBottom: 8 },
  stepSubtitle: { fontSize: 14, textAlign: "right", marginBottom: 18, lineHeight: 22 },
  label: { fontSize: 12, textAlign: "right", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    textAlign: "right",
  },
  chipsWrap: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 14 },
  footer: {
    flexDirection: "row-reverse",
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 4,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  btnPrimaryText: { fontSize: 15 },
  btnGhost: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  btnGhostText: { fontSize: 14 },
  signature: {
    textAlign: "center",
    fontSize: 11,
    marginTop: 8,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
});
