import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenHeader } from "@/components/ScreenHeader";
import { useColors } from "@/hooks/useColors";
import { arabicFont, arabicFontBold, arabicFontHeavy } from "@/constants/typography";
import {
  AiMessage,
  AiProvider,
  chatCompletion,
  clearApiKey,
  loadApiKey,
  providerInfo,
  saveApiKey,
} from "@/lib/ai";
import { generateId, loadJson, saveJson, STORAGE_KEYS } from "@/lib/storage";

export default function AIScreen() {
  const colors = useColors();
  const scrollRef = useRef<ScrollView>(null);

  const [bootLoaded, setBootLoaded] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [provider, setProvider] = useState<AiProvider>("openai");
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [key, msgs, prov] = await Promise.all([
        loadApiKey(),
        loadJson<AiMessage[]>(STORAGE_KEYS.aiMessages, []),
        loadJson<AiProvider>(STORAGE_KEYS.aiProvider, "openai"),
      ]);
      if (cancelled) return;
      setHasKey(!!key);
      setMessages(msgs);
      setProvider(prov);
      setBootLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (bootLoaded) saveJson(STORAGE_KEYS.aiMessages, messages);
  }, [messages, bootLoaded]);

  useEffect(() => {
    if (bootLoaded) saveJson(STORAGE_KEYS.aiProvider, provider);
  }, [provider, bootLoaded]);

  const onSaveKey = useCallback(async () => {
    const trimmed = keyInput.trim();
    if (trimmed.length < 10) {
      Alert.alert("مفتاح غير صالح", "تأكد من نسخ المفتاح كاملاً.");
      return;
    }
    try {
      await saveApiKey(trimmed);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setKeyInput("");
      setHasKey(true);
    } catch (e: any) {
      Alert.alert("تعذّر الحفظ", e?.message ?? "حاول مجدداً.");
    }
  }, [keyInput]);

  const onClearKey = useCallback(() => {
    Alert.alert(
      "حذف المفتاح",
      "سيُحذف المفتاح من القفل الآمن للجهاز.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            await clearApiKey();
            setHasKey(false);
          },
        },
      ],
    );
  }, []);

  const onSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    const key = await loadApiKey();
    if (!key) {
      setHasKey(false);
      return;
    }

    const userMsg: AiMessage = {
      id: generateId(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    Haptics.selectionAsync().catch(() => {});

    try {
      const reply = await chatCompletion(provider, key, messages, text);
      const aiMsg: AiMessage = {
        id: generateId(),
        role: "assistant",
        content: reply,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (e: any) {
      const errMsg: AiMessage = {
        id: generateId(),
        role: "assistant",
        content: `⚠ ${e?.message ?? "تعذّر الاتصال بالنموذج."}`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setSending(false);
    }
  }, [input, sending, provider, messages]);

  const onClearChat = useCallback(() => {
    Alert.alert("مسح المحادثة", "ستُحذف كل الرسائل.", [
      { text: "إلغاء", style: "cancel" },
      { text: "مسح", style: "destructive", onPress: () => setMessages([]) },
    ]);
  }, []);

  if (!bootLoaded) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.foreground} />
      </View>
    );
  }

  if (!hasKey) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="مركز الذكاء" subtitle="إعداد المفتاح أوّل مرة" />
        <ScrollView contentContainerStyle={styles.setupScroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.lockIcon, { borderColor: colors.foreground }]}>
              <Feather name="lock" size={20} color={colors.foreground} />
            </View>
            <Text style={[styles.setupTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
              فعّل مساعدك الذكي
            </Text>
            <Text style={[styles.setupDesc, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
              ضع مفتاح الذكاء الاصطناعي. يُخزَّن في القفل الآمن للجهاز باسم{" "}
              <Text style={{ fontFamily: arabicFontBold, color: colors.foreground }}>komil_ai</Text>{" "}
              ولا يُرسل لأي جهة سوى المزوّد الذي تختاره.
            </Text>

            <View style={styles.providerRow}>
              {(["openai", "openrouter", "groq"] as AiProvider[]).map((p) => {
                const active = provider === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setProvider(p);
                    }}
                    style={({ pressed }) => [
                      styles.providerChip,
                      {
                        borderColor: active ? colors.foreground : colors.border,
                        backgroundColor: active ? colors.foreground : "transparent",
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.providerChipText,
                        {
                          color: active ? colors.background : colors.foreground,
                          fontFamily: arabicFontBold,
                        },
                      ]}
                    >
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
                  borderColor: colors.border,
                  color: colors.foreground,
                  fontFamily: arabicFont,
                  backgroundColor: colors.background,
                },
              ]}
            />

            <Pressable
              onPress={onSaveKey}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: colors.foreground, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Feather name="key" size={14} color={colors.background} />
              <Text style={[styles.primaryBtnText, { color: colors.background, fontFamily: arabicFontBold }]}>
                حفظ في القفل الآمن
              </Text>
            </Pressable>

            <Text style={[styles.hint, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
              النموذج الافتراضي: {providerInfo(provider).model}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader
          title="مركز الذكاء"
          subtitle={`${providerInfo(provider).label} · ${providerInfo(provider).model}`}
        />

        <View style={styles.toolbar}>
          <Pressable
            onPress={onClearChat}
            style={({ pressed }) => [styles.toolBtn, { borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="trash-2" size={12} color={colors.mutedForeground} />
            <Text style={[styles.toolBtnText, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
              مسح المحادثة
            </Text>
          </Pressable>
          <Pressable
            onPress={onClearKey}
            style={({ pressed }) => [styles.toolBtn, { borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="key" size={12} color={colors.mutedForeground} />
            <Text style={[styles.toolBtnText, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
              تغيير المفتاح
            </Text>
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.chatScroll}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyChat}>
              <View style={[styles.emptyIcon, { borderColor: colors.border }]}>
                <Feather name="message-circle" size={20} color={colors.foreground} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: arabicFontBold }]}>
                ابدأ المحادثة
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                اسأل عن خطة مذاكرة، تفكيك مهمة، شرح مفهوم، أو خطة امتحان.
              </Text>
              <View style={styles.suggestList}>
                {[
                  "اشرح لي ما هو التكامل بطريقة بسيطة",
                  "ضع لي خطة مذاكرة لامتحان بعد ٧ أيام",
                  "كيف أنظّم وقتي بين ٣ مواد ثقيلة؟",
                ].map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setInput(s)}
                    style={({ pressed }) => [
                      styles.suggestChip,
                      { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
                    ]}
                  >
                    <Text style={[styles.suggestText, { color: colors.foreground, fontFamily: arabicFont }]}>
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            messages.map((m) => <Bubble key={m.id} message={m} />)
          )}
          {sending ? (
            <View style={[styles.bubble, styles.assistantBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ActivityIndicator color={colors.foreground} size="small" />
            </View>
          ) : null}
          <View style={{ height: 12 }} />
        </ScrollView>

        <View style={[styles.inputBar, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="اكتب سؤالك..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[
              styles.chatInput,
              {
                color: colors.foreground,
                fontFamily: arabicFont,
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          />
          <Pressable
            onPress={onSend}
            disabled={!input.trim() || sending}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: !input.trim() || sending ? colors.surface3 : colors.foreground,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Feather name="send" size={16} color={!input.trim() ? colors.mutedForeground : colors.background} />
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ message }: { message: AiMessage }) {
  const colors = useColors();
  const isUser = message.role === "user";
  return (
    <View
      style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.assistantBubble,
        {
          backgroundColor: isUser ? colors.foreground : colors.card,
          borderColor: isUser ? colors.foreground : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.bubbleText,
          {
            color: isUser ? colors.background : colors.foreground,
            fontFamily: arabicFont,
          },
        ]}
      >
        {message.content}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  setupScroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 60,
  },
  setupCard: {
    padding: 22,
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    alignItems: "center",
  },
  lockIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  setupTitle: { fontSize: 20, textAlign: "center" },
  setupDesc: { fontSize: 13, lineHeight: 22, textAlign: "center" },
  providerRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  providerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  providerChipText: { fontSize: 12 },
  keyInput: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    textAlign: "left",
    marginTop: 6,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 4,
  },
  primaryBtnText: { fontSize: 14 },
  hint: { fontSize: 11, marginTop: 4 },
  toolbar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
    justifyContent: "flex-start",
  },
  toolBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  toolBtnText: { fontSize: 11 },
  chatScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  emptyChat: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16 },
  emptyDesc: { fontSize: 12, textAlign: "center", lineHeight: 18, paddingHorizontal: 20 },
  suggestList: { gap: 8, width: "100%", marginTop: 12, paddingHorizontal: 16 },
  suggestChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggestText: { fontSize: 12, lineHeight: 18 },
  bubble: {
    maxWidth: "88%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 2,
  },
  userBubble: { alignSelf: "flex-end", borderTopRightRadius: 4 },
  assistantBubble: { alignSelf: "flex-start", borderTopLeftRadius: 4 },
  bubbleText: { fontSize: 13, lineHeight: 22, textAlign: "right" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 28 : 14,
    borderTopWidth: 1,
  },
  chatInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 140,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    textAlign: "right",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
