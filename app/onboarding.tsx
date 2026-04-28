import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
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
import { ARAB_COUNTRIES, findCountry } from "@/lib/universities";
import { useApp } from "@/store/AppContext";

const LEVELS = ["السنة الأولى", "السنة الثانية", "السنة الثالثة", "السنة الرابعة", "السنة الخامسة", "دراسات عُليا"];

export default function OnboardingScreen() {
  const colors = useColors();
  const { setUserName, setUniversity, setMajor, setLevel, setOnboarded } = useApp();

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState<string>("YE");
  const [uni, setUni] = useState("");
  const [uniCustom, setUniCustom] = useState("");
  const [maj, setMaj] = useState("");
  const [lvl, setLvl] = useState<string>("");

  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [uniPickerOpen, setUniPickerOpen] = useState(false);

  const country = useMemo(() => findCountry(countryCode), [countryCode]);

  const canNext = (() => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return !!country;
    if (step === 2) return true;
    if (step === 3) return true;
    return false;
  })();

  const tap = () => { if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {}); };

  const next = () => {
    tap();
    if (step < 3) {
      setStep((s) => (s + 1) as 0 | 1 | 2 | 3);
      return;
    }
    setUserName(name);
    const finalUni = uni === "أخرى" ? uniCustom : uni;
    setUniversity(finalUni ? `${finalUni} — ${country?.name ?? ""}`.trim() : country?.name ?? "");
    setMajor(maj);
    setLevel(lvl);
    setOnboarded(true);
  };

  const back = () => {
    if (step === 0) return;
    tap();
    setStep((s) => (s - 1) as 0 | 1 | 2 | 3);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Brand */}
          <View style={styles.brand}>
            <Logo size={56} />
            <Text style={[styles.brandTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>كُميل</Text>
            <Text style={[styles.brandSub, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
              نظامك الأكاديمي · بنكهة يمنية
            </Text>
          </View>

          {/* Progress */}
          <View style={styles.progressRow}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[styles.progressDot, {
                  backgroundColor: i <= step ? colors.foreground : colors.border,
                  width: i === step ? 24 : 6,
                }]}
              />
            ))}
          </View>

          {/* Step 0: Name */}
          {step === 0 && (
            <View style={styles.stepCard}>
              <Text style={[styles.stepTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>هلا والله 👋</Text>
              <Text style={[styles.stepSubtitle, { color: colors.mutedForeground, fontFamily: arabicFont }]}>وش اسمك يا بطل؟</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="مثلاً: عبدالله"
                placeholderTextColor={colors.mutedForeground}
                autoFocus
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border, fontFamily: arabicFont }]}
              />
            </View>
          )}

          {/* Step 1: Country */}
          {step === 1 && (
            <View style={styles.stepCard}>
              <Text style={[styles.stepTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>من أي دولة أنت؟</Text>
              <Text style={[styles.stepSubtitle, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                باختار لك جامعات بلدك
              </Text>
              <Pressable
                onPress={() => { tap(); setCountryPickerOpen(true); }}
                style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={{ fontSize: 26 }}>{country?.flag ?? "🌍"}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.selectorLabel, { color: colors.mutedForeground, fontFamily: arabicFont }]}>الدولة</Text>
                  <Text style={[styles.selectorValue, { color: colors.foreground, fontFamily: arabicFontBold }]}>
                    {country?.name ?? "اختر..."}
                  </Text>
                </View>
                <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
          )}

          {/* Step 2: University & Major */}
          {step === 2 && (
            <View style={styles.stepCard}>
              <Text style={[styles.stepTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>دراستك</Text>
              <Text style={[styles.stepSubtitle, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                جامعتك وتخصصك (اختياري)
              </Text>

              <Pressable
                onPress={() => { tap(); setUniPickerOpen(true); }}
                style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Feather name="award" size={20} color={colors.mutedForeground} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.selectorLabel, { color: colors.mutedForeground, fontFamily: arabicFont }]}>الجامعة</Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.selectorValue, { color: uni ? colors.foreground : colors.mutedForeground, fontFamily: arabicFontBold }]}
                  >
                    {uni || "اختر من القائمة..."}
                  </Text>
                </View>
                <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
              </Pressable>

              {uni === "أخرى" && (
                <TextInput
                  value={uniCustom}
                  onChangeText={setUniCustom}
                  placeholder="اكتب اسم جامعتك"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { marginTop: 10, color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border, fontFamily: arabicFont }]}
                />
              )}

              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: arabicFont, marginTop: 16 }]}>
                التخصص
              </Text>
              <TextInput
                value={maj}
                onChangeText={setMaj}
                placeholder="مثلاً: علوم حاسب، طب، هندسة..."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border, fontFamily: arabicFont }]}
              />
            </View>
          )}

          {/* Step 3: Level */}
          {step === 3 && (
            <View style={styles.stepCard}>
              <Text style={[styles.stepTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>المستوى الدراسي</Text>
              <Text style={[styles.stepSubtitle, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                اختر سنتك (اختياري)
              </Text>
              <View style={styles.chipsWrap}>
                {LEVELS.map((l) => {
                  const active = lvl === l;
                  return (
                    <Pressable
                      key={l}
                      onPress={() => { tap(); setLvl(active ? "" : l); }}
                      style={[styles.chip, {
                        backgroundColor: active ? colors.foreground : colors.surface,
                        borderColor: active ? colors.foreground : colors.border,
                      }]}
                    >
                      <Text style={[styles.chipText, {
                        color: active ? colors.background : colors.foreground,
                        fontFamily: active ? arabicFontBold : arabicFont,
                      }]}>{l}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {step > 0 && (
            <Pressable onPress={back} style={[styles.btnGhost, { borderColor: colors.border }]}>
              <Feather name="arrow-right" size={18} color={colors.foreground} />
              <Text style={[styles.btnGhostText, { color: colors.foreground, fontFamily: arabicFontBold }]}>السابق</Text>
            </Pressable>
          )}
          <Pressable
            onPress={next}
            disabled={!canNext}
            style={[styles.btnPrimary, {
              backgroundColor: canNext ? colors.foreground : colors.border,
              opacity: canNext ? 1 : 0.5,
            }]}
          >
            <Text style={[styles.btnPrimaryText, { color: colors.background, fontFamily: arabicFontHeavy }]}>
              {step < 3 ? "التالي" : "ابدأ الآن"}
            </Text>
            <Feather name={step < 3 ? "arrow-left" : "check"} size={18} color={colors.background} />
          </Pressable>
        </View>

        <Text style={[styles.signature, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
          من تطوير hmza Fahd · صُنع في اليمن
        </Text>
      </KeyboardAvoidingView>

      {/* Country picker modal */}
      <ListPickerModal
        visible={countryPickerOpen}
        onClose={() => setCountryPickerOpen(false)}
        title="اختر الدولة"
        items={ARAB_COUNTRIES.map((c) => ({ key: c.code, label: c.name, leading: c.flag }))}
        selectedKey={countryCode}
        onSelect={(k) => {
          setCountryCode(k);
          setUni("");
          setUniCustom("");
          setCountryPickerOpen(false);
        }}
        colors={colors}
      />

      {/* University picker modal */}
      <ListPickerModal
        visible={uniPickerOpen}
        onClose={() => setUniPickerOpen(false)}
        title={`جامعات ${country?.name ?? ""}`}
        items={(country?.universities ?? []).map((u) => ({ key: u, label: u }))}
        selectedKey={uni}
        onSelect={(k) => { setUni(k); setUniPickerOpen(false); }}
        colors={colors}
        searchable
      />
    </SafeAreaView>
  );
}

function ListPickerModal({
  visible, onClose, title, items, selectedKey, onSelect, colors, searchable,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  items: { key: string; label: string; leading?: string }[];
  selectedKey?: string;
  onSelect: (key: string) => void;
  colors: any;
  searchable?: boolean;
}) {
  const [q, setQ] = useState("");
  const filtered = q.trim()
    ? items.filter((it) => it.label.includes(q.trim()))
    : items;

  React.useEffect(() => { if (!visible) setQ(""); }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Feather name="x" size={20} color={colors.foreground} />
            </Pressable>
          </View>

          {searchable && (
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="ابحث..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border, fontFamily: arabicFont }]}
            />
          )}

          <FlatList
            data={filtered}
            keyExtractor={(it) => it.key}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border, opacity: 0.5 }} />}
            renderItem={({ item }) => {
              const active = selectedKey === item.key;
              return (
                <Pressable
                  onPress={() => onSelect(item.key)}
                  style={[styles.listItem, { backgroundColor: active ? colors.surface : "transparent" }]}
                >
                  {item.leading ? <Text style={{ fontSize: 22 }}>{item.leading}</Text> : null}
                  <Text style={[styles.listItemText, { color: colors.foreground, fontFamily: active ? arabicFontHeavy : arabicFont }]}>
                    {item.label}
                  </Text>
                  {active ? <Feather name="check" size={18} color={colors.foreground} /> : null}
                </Pressable>
              );
            }}
            style={{ flexGrow: 0 }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 24 },
  brand: { alignItems: "center", marginTop: 24, marginBottom: 24 },
  brandTitle: { fontSize: 32, marginTop: 14, letterSpacing: 0.5 },
  brandSub: { fontSize: 14, marginTop: 4 },
  progressRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 28 },
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
  selector: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 14,
  },
  selectorLabel: { fontSize: 11, textAlign: "right" },
  selectorValue: { fontSize: 15, textAlign: "right", marginTop: 2 },
  chipsWrap: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 10, marginTop: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
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
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    paddingHorizontal: 16,
    maxHeight: "80%",
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#444",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  modalTitle: { fontSize: 18, textAlign: "right" },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    fontSize: 14,
    textAlign: "right",
  },
  listItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  listItemText: { fontSize: 15, textAlign: "right", flex: 1 },
});
