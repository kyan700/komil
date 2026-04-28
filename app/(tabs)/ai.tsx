import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
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
import {
  AI_TOOLS,
  AiMessage,
  AiProvider,
  chatCompletion,
  detectProviderFromKey,
  isEnvKey,
  loadApiKey,
  providerInfo,
  saveApiKey,
} from "@/lib/ai";
import { generateId, loadJson, saveJson, STORAGE_KEYS } from "@/lib/storage";
import { useApp } from "@/store/AppContext";

type ToolKey = "summarize" | "quiz" | "studyPlan" | "explain";

const TOOL_META: Record<ToolKey, { title: string; sub: string; icon: any; placeholder: string }> = {
  summarize: { title: "تلخيص مادة", sub: "ألصق نصاً أو موضوعاً", icon: "file-text", placeholder: "موضوع المحاضرة أو نصها كاملاً..." },
  quiz: { title: "إنشاء اختبار", sub: "اختبر فهمك", icon: "edit-3", placeholder: "موضوع الاختبار، مثل: الخلية الحيوانية" },
  studyPlan: { title: "خطة دراسة", sub: "بومودورو ومعالم", icon: "calendar", placeholder: "ما الذي تحتاج خطة له؟ مثل: استعداد لاختبار البرمجة" },
  explain: { title: "اشرح لي", sub: "بأسلوب مبسّط", icon: "help-circle", placeholder: "المفهوم الذي تريد شرحه..." },
};

const SUGGESTIONS = [
  "هلا والله، خطّط لي يومي الدراسي",
  "وش الفرق بين الـ Stack والـ Queue؟",
  "كيف أحضّر لاختبار خلال 5 أيام؟",
  "اقترح لي طريقة لحفظ المصطلحات بسرعة",
];

export default function AiScreen() {
  const colors = useColors();
  const { userName, university, major } = useApp();

  const baked = isEnvKey();
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [provider, setProviderState] = useState<AiProvider>("gemini");
  const [keyInput, setKeyInput] = useState("");
  const [showKeyEditor, setShowKeyEditor] = useState(false);

  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tool, setTool] = useState<ToolKey | null>(null);
  const [toolText, setToolText] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  // Load persisted state
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [k, msgs] = await Promise.all([
        loadApiKey(),
        loadJson<AiMessage[]>(STORAGE_KEYS.aiMessages, []),
      ]);
      if (cancelled) return;
      setApiKeyState(k);
      setMessages(msgs);
      if (k) setProviderState(detectProviderFromKey(k));
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { saveJson(STORAGE_KEYS.aiMessages, messages); }, [messages]);

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

  const personalContext = useMemo(() => {
    const parts: string[] = [];
    if (userName) parts.push(`اسم الطالب: ${userName}`);
    if (major) parts.push(`التخصص: ${major}`);
    if (university) parts.push(`الجامعة: ${university}`);
    return parts.length ? `\n\nسياق الطالب:\n${parts.join("\n")}` : "";
  }, [userName, university, major]);

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    if (!apiKey) {
      setError("لم يُهيَّأ المفتاح بعد.");
      setShowKeyEditor(true);
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
      // Inject personal context once at the very first message
      const augmented = messages.length === 0 && personalContext ? `${content}${personalContext}` : content;
      const reply = await chatCompletion(provider, apiKey, messages, augmented);
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
  }, [input, busy, apiKey, provider, messages, personalContext]);

  const newChat = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setMessages([]);
    setError(null);
    setInput("");
  };

  const runTool = (key: ToolKey) => {
    setTool(key);
    setToolText("");
  };

  const submitTool = () => {
    if (!tool || !toolText.trim()) return;
    const prompt = AI_TOOLS[tool](toolText.trim());
    setTool(null);
    setToolText("");
    send(prompt);
  };

  const ready = !!apiKey;
  const info = providerInfo(provider);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Top bar — minimal ChatGPT style */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => setShowKeyEditor((v) => !v)} hitSlop={10} style={styles.topBtn}>
          <Feather name="settings" size={18} color={colors.mutedForeground} />
        </Pressable>
        <View style={styles.topCenter}>
          <Text style={[styles.topTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>كُميل</Text>
          <Text style={[styles.topSub, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
            {ready ? `${info.label} · ${info.model}` : "بدون اتصال"}
          </Text>
        </View>
        <Pressable onPress={newChat} hitSlop={10} style={styles.topBtn}>
          <Feather name="edit" size={18} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Settings panel */}
      {showKeyEditor && (
        <View style={[styles.settingsPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {baked && ready ? (
            <View>
              <View style={styles.settingsRow}>
                <Feather name="shield" size={16} color={colors.foreground} />
                <Text style={[styles.settingsTitle, { color: colors.foreground, fontFamily: arabicFontBold }]}>المفتاح مدمج في التطبيق</Text>
              </View>
              <Text style={[styles.settingsHint, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                النموذج: {info.label} · {info.model}
              </Text>
              <Pressable
                onPress={() => setShowKeyEditor(false)}
                style={[styles.settingsBtn, { backgroundColor: colors.foreground, marginTop: 12 }]}
              >
                <Text style={[styles.settingsBtnText, { color: colors.background, fontFamily: arabicFontBold }]}>تمام</Text>
              </Pressable>
            </View>
          ) : (
            <View>
              <Text style={[styles.settingsTitle, { color: colors.foreground, fontFamily: arabicFontBold }]}>تهيئة المفتاح</Text>
              <Text style={[styles.settingsHint, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                ألصق مفتاح Gemini أو OpenAI أو OpenRouter — يُكتشف النوع تلقائياً.
              </Text>
              <TextInput
                value={keyInput}
                onChangeText={setKeyInput}
                placeholder="AIza... / sk-..."
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.keyInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
              />
              <Pressable
                onPress={handleSaveKey}
                disabled={!keyInput.trim()}
                style={[styles.settingsBtn, {
                  backgroundColor: keyInput.trim() ? colors.foreground : colors.border,
                  opacity: keyInput.trim() ? 1 : 0.5,
                  marginTop: 10,
                }]}
              >
                <Text style={[styles.settingsBtnText, { color: colors.background, fontFamily: arabicFontBold }]}>حفظ</Text>
              </Pressable>
            </View>
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
          {messages.length === 0 ? (
            <Welcome
              colors={colors}
              userName={userName}
              ready={ready}
              onTool={runTool}
              onSuggest={(s) => send(s)}
            />
          ) : (
            messages.map((m, i) => (
              <Bubble
                key={m.id}
                message={m}
                colors={colors}
                showAvatar={m.role === "assistant" && (i === 0 || messages[i - 1].role !== "assistant")}
              />
            ))
          )}

          {busy && <TypingIndicator colors={colors} />}

          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Feather name="alert-circle" size={14} color={colors.foreground} />
              <Text style={[styles.errorText, { color: colors.foreground, fontFamily: arabicFont }]}>{error}</Text>
            </View>
          )}
          <View style={{ height: 12 }} />
        </ScrollView>

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Pressable
              onPress={() => runTool("summarize")}
              hitSlop={10}
              style={styles.toolBtn}
              disabled={!ready || busy}
            >
              <Feather name="plus" size={20} color={ready ? colors.foreground : colors.mutedForeground} />
            </Pressable>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={ready ? "اسأل كُميل..." : "أضف المفتاح أولاً"}
              placeholderTextColor={colors.mutedForeground}
              editable={ready && !busy}
              multiline
              style={[styles.input, { color: colors.foreground, fontFamily: arabicFont }]}
            />
            <Pressable
              onPress={() => send()}
              disabled={!ready || busy || !input.trim()}
              style={[styles.sendBtn, {
                backgroundColor: ready && input.trim() && !busy ? colors.foreground : "transparent",
                opacity: ready && input.trim() && !busy ? 1 : 0.4,
              }]}
            >
              <Feather
                name="arrow-up"
                size={18}
                color={ready && input.trim() && !busy ? colors.background : colors.mutedForeground}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Tool prompt modal */}
      <Modal visible={tool !== null} animationType="slide" transparent onRequestClose={() => setTool(null)}>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ width: "100%" }}>
            <View style={[styles.modalSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
                  {tool ? TOOL_META[tool].title : ""}
                </Text>
                <Pressable onPress={() => setTool(null)} hitSlop={12}>
                  <Feather name="x" size={20} color={colors.foreground} />
                </Pressable>
              </View>
              <Text style={[styles.modalSub, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                {tool ? TOOL_META[tool].sub : ""}
              </Text>
              <TextInput
                value={toolText}
                onChangeText={setToolText}
                placeholder={tool ? TOOL_META[tool].placeholder : ""}
                placeholderTextColor={colors.mutedForeground}
                multiline
                autoFocus
                style={[styles.modalInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border, fontFamily: arabicFont }]}
              />
              <Pressable
                onPress={submitTool}
                disabled={!toolText.trim()}
                style={[styles.modalBtn, {
                  backgroundColor: toolText.trim() ? colors.foreground : colors.border,
                  opacity: toolText.trim() ? 1 : 0.5,
                }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.background, fontFamily: arabicFontHeavy }]}>إرسال</Text>
                <Feather name="arrow-left" size={16} color={colors.background} />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Welcome({ colors, userName, ready, onTool, onSuggest }: {
  colors: any;
  userName: string;
  ready: boolean;
  onTool: (k: ToolKey) => void;
  onSuggest: (s: string) => void;
}) {
  const tools: ToolKey[] = ["summarize", "quiz", "studyPlan", "explain"];
  return (
    <View style={styles.welcome}>
      <View style={styles.welcomeBrand}>
        <Logo size={48} />
        <Text style={[styles.welcomeTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
          هلا{userName ? ` ${userName}` : " والله"}
        </Text>
        <Text style={[styles.welcomeSub, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
          كيف أقدر أساعدك اليوم؟
        </Text>
      </View>

      <View style={styles.toolsGrid}>
        {tools.map((k) => {
          const meta = TOOL_META[k];
          return (
            <Pressable
              key={k}
              onPress={() => onTool(k)}
              disabled={!ready}
              style={[styles.toolCard, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: ready ? 1 : 0.5,
              }]}
            >
              <View style={[styles.toolIcon, { borderColor: colors.border }]}>
                <Feather name={meta.icon} size={16} color={colors.foreground} />
              </View>
              <Text style={[styles.toolTitle, { color: colors.foreground, fontFamily: arabicFontBold }]}>{meta.title}</Text>
              <Text style={[styles.toolSub, { color: colors.mutedForeground, fontFamily: arabicFont }]}>{meta.sub}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.suggestLabel, { color: colors.mutedForeground, fontFamily: arabicFont }]}>اقتراحات:</Text>
      <View style={styles.suggestList}>
        {SUGGESTIONS.map((s) => (
          <Pressable
            key={s}
            onPress={() => ready && onSuggest(s)}
            disabled={!ready}
            style={[styles.suggestItem, { borderColor: colors.border, opacity: ready ? 1 : 0.5 }]}
          >
            <Text style={[styles.suggestText, { color: colors.foreground, fontFamily: arabicFont }]}>{s}</Text>
            <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Bubble({ message, colors, showAvatar }: { message: AiMessage; colors: any; showAvatar: boolean }) {
  const isUser = message.role === "user";

  const handleLongPress = async () => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
  };

  if (isUser) {
    return (
      <Pressable onLongPress={handleLongPress} style={styles.userRow}>
        <View style={[styles.userBubble, { backgroundColor: colors.foreground }]}>
          <Text style={[styles.userText, { color: colors.background, fontFamily: arabicFont }]}>
            {message.content}
          </Text>
        </View>
      </Pressable>
    );
  }
  return (
    <View style={styles.aiRow}>
      <View style={styles.aiAvatarCol}>
        {showAvatar ? (
          <View style={[styles.aiAvatar, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Logo size={16} />
          </View>
        ) : <View style={styles.aiAvatarPlaceholder} />}
      </View>
      <Pressable onLongPress={handleLongPress} style={{ flex: 1 }}>
        <Text style={[styles.aiText, { color: colors.foreground, fontFamily: arabicFont }]}>
          {message.content}
        </Text>
      </Pressable>
    </View>
  );
}

function TypingIndicator({ colors }: { colors: any }) {
  const a1 = useRef(new Animated.Value(0.3)).current;
  const a2 = useRef(new Animated.Value(0.3)).current;
  const a3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const make = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.3, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      );
    const loops = [make(a1, 0), make(a2, 150), make(a3, 300)];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [a1, a2, a3]);

  return (
    <View style={styles.aiRow}>
      <View style={styles.aiAvatarCol}>
        <View style={[styles.aiAvatar, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Logo size={16} />
        </View>
      </View>
      <View style={styles.typingDots}>
        <Animated.View style={[styles.typingDot, { backgroundColor: colors.foreground, opacity: a1 }]} />
        <Animated.View style={[styles.typingDot, { backgroundColor: colors.foreground, opacity: a2 }]} />
        <Animated.View style={[styles.typingDot, { backgroundColor: colors.foreground, opacity: a3 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  topBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  topCenter: { alignItems: "center", flex: 1 },
  topTitle: { fontSize: 18 },
  topSub: { fontSize: 10, marginTop: 2 },
  settingsPanel: {
    margin: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  settingsRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8, marginBottom: 4 },
  settingsTitle: { fontSize: 14, textAlign: "right" },
  settingsHint: { fontSize: 12, textAlign: "right", lineHeight: 18, marginTop: 4 },
  keyInput: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 13,
  },
  settingsBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  settingsBtnText: { fontSize: 13 },
  chatScroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 4 },

  // Welcome
  welcome: { paddingTop: 30, paddingBottom: 20 },
  welcomeBrand: { alignItems: "center", marginBottom: 30 },
  welcomeTitle: { fontSize: 26, marginTop: 14, letterSpacing: 0.3 },
  welcomeSub: { fontSize: 14, marginTop: 6 },
  toolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  toolCard: {
    width: "47.5%",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    minHeight: 100,
  },
  toolIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  toolTitle: { fontSize: 14, textAlign: "right" },
  toolSub: { fontSize: 11, textAlign: "right" },
  suggestLabel: { fontSize: 12, textAlign: "right", marginBottom: 8 },
  suggestList: { gap: 8 },
  suggestItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 14,
  },
  suggestText: { fontSize: 13, textAlign: "right", flex: 1 },

  // User bubble
  userRow: {
    alignItems: "flex-end",
    marginVertical: 6,
  },
  userBubble: {
    maxWidth: "85%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomRightRadius: 6,
  },
  userText: { fontSize: 14, lineHeight: 22, textAlign: "right" },

  // AI message (no bubble, ChatGPT style)
  aiRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 10,
    marginVertical: 8,
  },
  aiAvatarCol: { width: 28, alignItems: "center" },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  aiAvatarPlaceholder: { width: 28, height: 28 },
  aiText: { fontSize: 14, lineHeight: 24, textAlign: "right" },

  // Typing
  typingDots: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    paddingTop: 10,
  },
  typingDot: { width: 6, height: 6, borderRadius: 3 },

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

  // Input bar
  inputBar: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 26 : 14,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 26,
    borderWidth: 1,
  },
  toolBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
  },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 130,
    paddingHorizontal: 8,
    paddingVertical: 9,
    fontSize: 15,
    textAlign: "right",
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  // Tool modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  modalTitle: { fontSize: 18, textAlign: "right" },
  modalSub: { fontSize: 12, textAlign: "right", marginBottom: 14 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    textAlign: "right",
    minHeight: 110,
    textAlignVertical: "top",
    marginBottom: 14,
  },
  modalBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  modalBtnText: { fontSize: 15 },
});
