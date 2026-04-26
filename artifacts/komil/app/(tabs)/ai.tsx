import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Logo } from "@/components/Logo";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useColors } from "@/hooks/useColors";
import { arabicFont, arabicFontBold, arabicFontHeavy } from "@/constants/typography";
import {
  AiMessage,
  AiProvider,
  chatCompletion,
  detectProviderFromKey,
  envApiKey,
  isEnvKey,
  loadApiKey,
  providerInfo,
  saveApiKey,
} from "@/lib/ai";
import { generateId, loadJson, saveJson, STORAGE_KEYS } from "@/lib/storage";
import { useApp } from "@/store/AppContext";

const QUICK_PROMPTS = [
  "خطّط لي يوم دراسي مكثّف",
  "لخّص لي الفرق بين الـ Hash Map و الـ Tree Map",
  "كيف أحضّر للاختبار النهائي خلال 5 أيام؟",
  "اقترح طريقة لحفظ المصطلحات بسرعة",
];

export default function AiScreen() {
  const colors = useColors();
  const { userName, university, major } = useApp();

  const baked = isEnvKey();
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [provider, setProviderState] = useState<AiProvider>("openai");
  const [keyInput, setKeyInput] = useState("");
  const [showKeyEditor, setShowKeyEditor] = useState(false);

  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Load persisted state
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [k, msgs, prov] = await Promise.all([
        loadApiKey(),
        loadJson<AiMessage[]>(STORAGE_KEYS.aiMessages, []),
        loadJson<AiProvider>(STORAGE_KEYS.aiProvider, "openai"),
      ]);
      if (cancelled) return;
      setApiKeyState(k);
      setMessages(msgs);
      // If env key, prefer auto-detection
      if (baked && k) {
        setProviderState(detectProviderFromKey(k));
      } else {
        setProviderState(prov);
      }
    })();
    return () => { cancelled = true; };
  }, [baked]);

  useEffect(() => {
    saveJson(STORAGE_KEYS.aiMessages, messages);
  }, [messages]);
  useEffect(() => {
    if (!baked) saveJson(STORAGE_KEYS.aiProvider, provider);
  }, [provider, baked]);

  const handleSaveKey = async () => {
    const k = keyInput.trim();
    if (!k) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await saveApiKey(k);
    setApiKeyState(k);
    setProviderState(detectProviderFromKey(k));
    setKeyInput("");
    setShowKeyEditor(false);
    setError(null);
  };

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    if (!apiKey) {
      setError("لم يُهيَّأ المفتاح بعد. اضغط 'إعدادات الذكاء' لإضافته.");
      return;
    }
    setError(null);
    setBusy(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    const userMsg: AiMessage = {
      id: generateId(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

    try {
      const reply = await chatCompletion(provider, apiKey, messages, content);
      const aiMsg: AiMessage = {
        id: generateId(),
        role: "assistant",
        content: reply,
        createdAt: new Date().toISOString(),
      };
      setMessages([...newHistory, aiMsg]);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } catch (e: any) {
      setError(e?.message || "حدث خطأ غير متوقّع");
    } finally {
      setBusy(false);
    }
  }, [input, busy, apiKey, provider, messages]);

  const clearChat = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setMessages([]);
    setError(null);
  };

  const ready = !!apiKey;
  const info = providerInfo(provider);

  // Personalised greeting line
  const personalLine = useMemo(() => {
    const parts: string[] = [];
    if (userName) parts.push(userName);
    if (major) parts.push(`· ${major}`);
    if (university) parts.push(`· ${university}`);
    return parts.join(" ");
  }, [userName, major, university]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="كُميل"
        subtitle={ready ? `${info.label} · ${info.model}` : "إعداد المساعد"}
        rightIcon="more-horizontal"
        onRightPress={() => setShowKeyEditor((v) => !v)}
      />

      {/* Settings panel (only when needed) */}
      {(showKeyEditor || !ready) && (
        <View style={[styles.settingsPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {baked && ready ? (
            <>
              <View style={styles.settingsRow}>
                <Feather name="shield" size={16} color={colors.foreground} />
                <Text style={[styles.settingsTitle, { color: colors.foreground, fontFamily: arabicFontBold }]}>
                  المفتاح مدمج في التطبيق
                </Text>
              </View>
              <Text style={[styles.settingsHint, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                لا تحتاج لإدخال أي مفتاح — كُميل جاهز للاستخدام مباشرة.
              </Text>
              <View style={styles.settingsBtnRow}>
                <Pressable
                  onPress={() => setShowKeyEditor(false)}
                  style={[styles.settingsBtn, { backgroundColor: colors.foreground }]}
                >
                  <Text style={[styles.settingsBtnText, { color: colors.background, fontFamily: arabicFontBold }]}>
                    حسناً
                  </Text>
                </Pressable>
                <Pressable
                  onPress={clearChat}
                  style={[styles.settingsBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
                >
                  <Text style={[styles.settingsBtnText, { color: colors.foreground, fontFamily: arabicFontBold }]}>
                    مسح المحادثة
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.settingsTitle, { color: colors.foreground, fontFamily: arabicFontBold }]}>
                {ready ? "إعدادات المفتاح" : "تهيئة المساعد"}
              </Text>
              <Text style={[styles.settingsHint, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                ألصق مفتاح API الخاص بك. يُحفظ بأمان في مخزن الجهاز.
              </Text>

              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: arabicFont, marginTop: 10 }]}>
                المزوّد
              </Text>
              <View style={styles.providerRow}>
                {(["openai", "openrouter", "groq"] as AiProvider[]).map((p) => {
                  const active = provider === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setProviderState(p)}
                      style={[
                        styles.providerChip,
                        {
                          backgroundColor: active ? colors.foreground : "transparent",
                          borderColor: active ? colors.foreground : colors.border,
                        },
                      ]}
                    >
                      <Text style={[
                        styles.providerChipText,
                        {
                          color: active ? colors.background : colors.foreground,
                          fontFamily: active ? arabicFontBold : arabicFont,
                        },
                      ]}>
                        {providerInfo(p).label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                value={keyInput}
                onChangeText={setKeyInput}
                placeholder="sk-..."
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.keyInput,
                  {
                    color: colors.foreground,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              />

              <View style={styles.settingsBtnRow}>
                <Pressable
                  onPress={handleSaveKey}
                  disabled={!keyInput.trim()}
                  style={[
                    styles.settingsBtn,
                    {
                      backgroundColor: keyInput.trim() ? colors.foreground : colors.border,
                      opacity: keyInput.trim() ? 1 : 0.5,
                    },
                  ]}
                >
                  <Text style={[styles.settingsBtnText, { color: colors.background, fontFamily: arabicFontBold }]}>
                    حفظ المفتاح
                  </Text>
                </Pressable>
                {ready && (
                  <Pressable
                    onPress={() => setShowKeyEditor(false)}
                    style={[styles.settingsBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
                  >
                    <Text style={[styles.settingsBtnText, { color: colors.foreground, fontFamily: arabicFontBold }]}>
                      إلغاء
                    </Text>
                  </Pressable>
                )}
              </View>
            </>
          )}
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.chatScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 && ready ? (
            <View style={styles.welcomeBox}>
              <Logo size={42} />
              <Text style={[styles.welcomeTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
                مرحباً {userName || "صديقي"}
              </Text>
              {personalLine && personalLine !== userName && (
                <Text style={[styles.welcomeSub, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                  {personalLine}
                </Text>
              )}
              <Text style={[styles.welcomeHint, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                اسألني عن دراستك، أو اطلب خطة، أو شرحاً لمفهوم
              </Text>

              <View style={styles.promptsWrap}>
                {QUICK_PROMPTS.map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => send(p)}
                    style={[styles.promptCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <Text style={[styles.promptText, { color: colors.foreground, fontFamily: arabicFont }]}>
                      {p}
                    </Text>
                    <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {messages.map((m) => (
            <Bubble key={m.id} message={m} colors={colors} />
          ))}

          {busy && (
            <View style={[styles.bubble, styles.aiBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ActivityIndicator size="small" color={colors.foreground} />
              <Text style={[styles.thinkingText, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                يفكر...
              </Text>
            </View>
          )}

          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Feather name="alert-circle" size={14} color={colors.foreground} />
              <Text style={[styles.errorText, { color: colors.foreground, fontFamily: arabicFont }]}>
                {error}
              </Text>
            </View>
          )}
          <View style={{ height: 14 }} />
        </ScrollView>

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          {messages.length > 0 && (
            <Pressable
              onPress={clearChat}
              hitSlop={10}
              style={[styles.iconBtn, { borderColor: colors.border }]}
            >
              <Feather name="trash-2" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={ready ? "اكتب رسالتك لكُميل..." : "يلزم تهيئة المفتاح أولاً"}
            placeholderTextColor={colors.mutedForeground}
            editable={ready && !busy}
            multiline
            style={[
              styles.input,
              { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border, fontFamily: arabicFont },
            ]}
          />
          <Pressable
            onPress={() => send()}
            disabled={!ready || busy || !input.trim()}
            style={[
              styles.sendBtn,
              {
                backgroundColor: ready && input.trim() && !busy ? colors.foreground : colors.border,
                opacity: ready && input.trim() && !busy ? 1 : 0.5,
              },
            ]}
          >
            <Feather name="arrow-up" size={18} color={colors.background} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Bubble({ message, colors }: { message: AiMessage; colors: any }) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble, {
      backgroundColor: isUser ? colors.foreground : colors.surface,
      borderColor: isUser ? colors.foreground : colors.border,
    }]}>
      <Text style={[
        styles.bubbleText,
        {
          color: isUser ? colors.background : colors.foreground,
          fontFamily: arabicFont,
        },
      ]}>
        {message.content}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  settingsPanel: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  settingsRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8, marginBottom: 6 },
  settingsTitle: { fontSize: 15, textAlign: "right" },
  settingsHint: { fontSize: 12, textAlign: "right", lineHeight: 18, marginTop: 4 },
  label: { fontSize: 11, textAlign: "right" },
  providerRow: { flexDirection: "row-reverse", gap: 8, marginTop: 6 },
  providerChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  providerChipText: { fontSize: 12 },
  keyInput: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 13,
    textAlign: "left",
  },
  settingsBtnRow: { flexDirection: "row-reverse", gap: 8, marginTop: 12 },
  settingsBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  settingsBtnText: { fontSize: 13 },
  chatScroll: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12 },
  welcomeBox: { alignItems: "center", paddingVertical: 12 },
  welcomeTitle: { fontSize: 22, marginTop: 12 },
  welcomeSub: { fontSize: 13, marginTop: 2, textAlign: "center" },
  welcomeHint: { fontSize: 13, marginTop: 8, textAlign: "center" },
  promptsWrap: { width: "100%", marginTop: 18, gap: 8 },
  promptCard: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 14,
  },
  promptText: { fontSize: 13, textAlign: "right", flex: 1 },
  bubble: {
    maxWidth: "88%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 4,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  userBubble: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 22, textAlign: "right" },
  thinkingText: { fontSize: 12 },
  errorBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 6,
  },
  errorText: { fontSize: 12, flex: 1, textAlign: "right" },
  inputBar: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 26 : 14,
    borderTopWidth: 1,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 14,
    textAlign: "right",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
