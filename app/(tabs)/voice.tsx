import { Feather } from "@expo/vector-icons";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
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

import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useColors } from "@/hooks/useColors";
import { arabicFont, arabicFontBold, arabicFontHeavy } from "@/constants/typography";
import {
  formatBytes,
  formatDuration,
  moveRecordingToSubject,
  persistRecording,
} from "@/lib/recordings";
import type { Recording, Subject } from "@/lib/types";
import { useApp } from "@/store/AppContext";

export default function VoiceScreen() {
  const colors = useColors();
  const {
    subjects,
    recordings,
    addRecording,
    updateRecording,
    deleteRecording,
  } = useApp();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder, 250);
  const [permission, setPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busySaving, setBusySaving] = useState(false);

  // Pending save (after stop)
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [pendingDurationMs, setPendingDurationMs] = useState<number>(0);
  const [pendingName, setPendingName] = useState<string>("");
  const [pendingSubjectId, setPendingSubjectId] = useState<string | undefined>(undefined);

  // Currently playing recording (controls inline mini-player)
  const [activeRecId, setActiveRecId] = useState<string | null>(null);

  // Rename modal
  const [renameTarget, setRenameTarget] = useState<Recording | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [renameSubjectId, setRenameSubjectId] = useState<string | undefined>(undefined);

  // Pulse animation
  const pulse = useRef(new Animated.Value(1)).current;

  // Permission once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await AudioModule.requestRecordingPermissionsAsync();
        if (cancelled) return;
        setPermission(!!status.granted);
        if (status.granted) {
          await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        }
      } catch (e: any) {
        setPermission(false);
        setError("لم نستطع الوصول للميكروفون.");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Pulse animation when recording
  useEffect(() => {
    if (recState.isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.18, duration: 750, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [recState.isRecording, pulse]);

  const startRecording = useCallback(async () => {
    setError(null);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    try {
      if (permission !== true) {
        const status = await AudioModule.requestRecordingPermissionsAsync();
        setPermission(!!status.granted);
        if (!status.granted) {
          setError("نحتاج إذن الميكروفون للتسجيل.");
          return;
        }
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (e: any) {
      setError(e?.message || "تعذّر بدء التسجيل.");
    }
  }, [permission, recorder]);

  const stopRecording = useCallback(async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    try {
      await recorder.stop();
      const uri = recorder.uri;
      const dur = recState.durationMillis ?? 0;
      if (!uri) {
        setError("لم يُحفظ الملف، حاول مجدداً.");
        return;
      }
      setPendingUri(uri);
      setPendingDurationMs(dur);
      const now = new Date();
      const defaultName = `تسجيل ${now.getDate()}/${now.getMonth() + 1} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      setPendingName(defaultName);
      setPendingSubjectId(undefined);
    } catch (e: any) {
      setError(e?.message || "تعذّر إيقاف التسجيل.");
    }
  }, [recorder, recState.durationMillis]);

  const cancelPending = useCallback(() => {
    setPendingUri(null);
    setPendingDurationMs(0);
    setPendingName("");
    setPendingSubjectId(undefined);
  }, []);

  const confirmSave = useCallback(async () => {
    if (!pendingUri) return;
    if (!pendingName.trim()) {
      setError("اكتب اسماً للتسجيل.");
      return;
    }
    setBusySaving(true);
    try {
      const { uri, sizeBytes } = await persistRecording(pendingUri, pendingSubjectId, pendingName.trim());
      addRecording({
        name: pendingName.trim(),
        subjectId: pendingSubjectId,
        uri,
        durationMs: pendingDurationMs,
        sizeBytes,
      });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      cancelPending();
    } catch (e: any) {
      setError(e?.message || "تعذّر حفظ الملف.");
    } finally {
      setBusySaving(false);
    }
  }, [pendingUri, pendingName, pendingSubjectId, pendingDurationMs, addRecording, cancelPending]);

  // Group recordings by subject
  const groups = useMemo(() => {
    const map = new Map<string, { subject: Subject | null; items: Recording[] }>();
    for (const r of recordings) {
      const key = r.subjectId || "_uncategorized";
      if (!map.has(key)) {
        const sub = r.subjectId ? subjects.find((s) => s.id === r.subjectId) : null;
        map.set(key, { subject: sub ?? null, items: [] });
      }
      map.get(key)!.items.push(r);
    }
    // Order: subjects with items by created order, then uncategorized last
    const arr = Array.from(map.entries()).map(([key, val]) => ({ key, ...val }));
    arr.sort((a, b) => {
      if (a.key === "_uncategorized") return 1;
      if (b.key === "_uncategorized") return -1;
      return (a.subject?.name ?? "").localeCompare(b.subject?.name ?? "", "ar");
    });
    return arr;
  }, [recordings, subjects]);

  const handlePlay = useCallback((rec: Recording) => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    setActiveRecId((cur) => (cur === rec.id ? null : rec.id));
  }, []);

  const openRename = useCallback((rec: Recording) => {
    setRenameTarget(rec);
    setRenameInput(rec.name);
    setRenameSubjectId(rec.subjectId);
  }, []);

  const confirmRename = useCallback(async () => {
    if (!renameTarget) return;
    const newName = renameInput.trim();
    if (!newName) return;
    const subjectChanged = renameSubjectId !== renameTarget.subjectId;
    let newUri = renameTarget.uri;
    if (subjectChanged) {
      try {
        newUri = await moveRecordingToSubject(renameTarget.uri, renameSubjectId, newName);
      } catch {
        // keep old uri
      }
    }
    updateRecording(renameTarget.id, {
      name: newName,
      subjectId: renameSubjectId,
      uri: newUri,
    });
    setRenameTarget(null);
    setRenameInput("");
  }, [renameTarget, renameInput, renameSubjectId, updateRecording]);

  const handleDelete = useCallback((rec: Recording) => {
    Alert.alert(
      "حذف التسجيل",
      `سيتم حذف "${rec.name}" نهائياً.`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: () => {
            if (activeRecId === rec.id) setActiveRecId(null);
            deleteRecording(rec.id);
          },
        },
      ],
    );
  }, [activeRecId, deleteRecording]);

  const liveDur = recState.durationMillis ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="المسجل" subtitle="سجّل بأي اسم — احفظ في مجلد المادة — استمع متى ما تبي" />

      {/* Recorder area */}
      <View style={styles.recorderArea}>
        <Text style={[styles.timer, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
          {formatDuration(liveDur)}
        </Text>
        <Text style={[styles.timerLabel, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
          {recState.isRecording ? "جاري التسجيل" : permission === false ? "لا يوجد إذن للميكروفون" : "اضغط للبدء"}
        </Text>

        <Animated.View style={{ transform: [{ scale: pulse }], marginTop: 28 }}>
          <Pressable
            onPress={recState.isRecording ? stopRecording : startRecording}
            disabled={permission === false}
            style={({ pressed }) => [
              styles.recordBtn,
              {
                backgroundColor: recState.isRecording ? colors.destructive : colors.foreground,
                opacity: permission === false ? 0.4 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather
              name={recState.isRecording ? "square" : "mic"}
              size={36}
              color={recState.isRecording ? colors.destructiveForeground : colors.background}
            />
          </Pressable>
        </Animated.View>

        <Text style={[styles.hint, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
          الملفات تُحفظ على الجهاز فقط — أوفلاين 100%.
        </Text>

        {error && (
          <View style={[styles.errorPill, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Feather name="alert-circle" size={12} color={colors.foreground} />
            <Text style={[styles.errorPillText, { color: colors.foreground, fontFamily: arabicFont }]}>{error}</Text>
          </View>
        )}
      </View>

      {/* Recordings list */}
      <View style={styles.listSection}>
        <View style={styles.listHeaderRow}>
          <Text style={[styles.listTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
            المكتبة
          </Text>
          <Text style={[styles.listCount, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
            {recordings.length} تسجيل
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.listScroll} showsVerticalScrollIndicator={false}>
          {recordings.length === 0 ? (
            <EmptyState
              icon="folder"
              title="لا توجد تسجيلات بعد"
              description="ابدأ بتسجيل، ثم احفظ بأي اسم في مجلد المادة"
            />
          ) : (
            groups.map((g) => (
              <View key={g.key} style={styles.group}>
                <View style={[styles.groupHeader, { borderColor: colors.border }]}>
                  <Feather
                    name={g.subject ? "folder" : "inbox"}
                    size={14}
                    color={colors.mutedForeground}
                  />
                  <Text style={[styles.groupTitle, { color: colors.foreground, fontFamily: arabicFontBold }]}>
                    {g.subject?.name ?? "بدون مادة"}
                  </Text>
                  <View style={[styles.groupCount, { borderColor: colors.border }]}>
                    <Text style={[styles.groupCountText, { color: colors.mutedForeground, fontFamily: arabicFontBold }]}>
                      {g.items.length}
                    </Text>
                  </View>
                </View>

                {g.items.map((rec) => (
                  <RecordingRow
                    key={rec.id}
                    rec={rec}
                    isActive={activeRecId === rec.id}
                    colors={colors}
                    onPlayToggle={() => handlePlay(rec)}
                    onRename={() => openRename(rec)}
                    onDelete={() => handleDelete(rec)}
                  />
                ))}
              </View>
            ))
          )}
          <View style={{ height: 120 }} />
        </ScrollView>
      </View>

      {/* Save modal — after stop */}
      <Modal
        visible={pendingUri !== null}
        transparent
        animationType="slide"
        onRequestClose={cancelPending}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ width: "100%" }}>
            <View style={[styles.modalSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
                  حفظ التسجيل
                </Text>
                <Text style={[styles.modalDur, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                  {formatDuration(pendingDurationMs)}
                </Text>
              </View>

              <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                الاسم
              </Text>
              <TextInput
                value={pendingName}
                onChangeText={setPendingName}
                placeholder="مثلاً: محاضرة الفيزياء — السرعة المتجهة"
                placeholderTextColor={colors.mutedForeground}
                autoFocus
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border, fontFamily: arabicFont }]}
              />

              <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: arabicFont, marginTop: 14 }]}>
                المجلد (المادة)
              </Text>
              <SubjectChips
                subjects={subjects}
                value={pendingSubjectId}
                onChange={setPendingSubjectId}
                colors={colors}
              />

              <View style={styles.modalActions}>
                <Pressable
                  onPress={cancelPending}
                  disabled={busySaving}
                  style={[styles.btnGhost, { borderColor: colors.border }]}
                >
                  <Text style={[styles.btnGhostText, { color: colors.foreground, fontFamily: arabicFontBold }]}>تجاهل</Text>
                </Pressable>
                <Pressable
                  onPress={confirmSave}
                  disabled={busySaving || !pendingName.trim()}
                  style={[styles.btnPrimary, {
                    backgroundColor: pendingName.trim() && !busySaving ? colors.foreground : colors.border,
                    opacity: pendingName.trim() && !busySaving ? 1 : 0.5,
                  }]}
                >
                  {busySaving ? (
                    <ActivityIndicator color={colors.background} size="small" />
                  ) : (
                    <>
                      <Feather name="check" size={16} color={colors.background} />
                      <Text style={[styles.btnPrimaryText, { color: colors.background, fontFamily: arabicFontHeavy }]}>حفظ</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Rename modal */}
      <Modal
        visible={renameTarget !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setRenameTarget(null)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ width: "100%" }}>
            <View style={[styles.modalSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: arabicFontHeavy }]}>
                  تعديل التسجيل
                </Text>
                <Pressable onPress={() => setRenameTarget(null)} hitSlop={12}>
                  <Feather name="x" size={20} color={colors.foreground} />
                </Pressable>
              </View>

              <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: arabicFont }]}>الاسم</Text>
              <TextInput
                value={renameInput}
                onChangeText={setRenameInput}
                placeholder="اسم التسجيل"
                placeholderTextColor={colors.mutedForeground}
                autoFocus
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border, fontFamily: arabicFont }]}
              />

              <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: arabicFont, marginTop: 14 }]}>
                المجلد (المادة)
              </Text>
              <SubjectChips
                subjects={subjects}
                value={renameSubjectId}
                onChange={setRenameSubjectId}
                colors={colors}
              />

              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => setRenameTarget(null)}
                  style={[styles.btnGhost, { borderColor: colors.border }]}
                >
                  <Text style={[styles.btnGhostText, { color: colors.foreground, fontFamily: arabicFontBold }]}>إلغاء</Text>
                </Pressable>
                <Pressable
                  onPress={confirmRename}
                  disabled={!renameInput.trim()}
                  style={[styles.btnPrimary, {
                    backgroundColor: renameInput.trim() ? colors.foreground : colors.border,
                    opacity: renameInput.trim() ? 1 : 0.5,
                  }]}
                >
                  <Feather name="check" size={16} color={colors.background} />
                  <Text style={[styles.btnPrimaryText, { color: colors.background, fontFamily: arabicFontHeavy }]}>حفظ</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

function SubjectChips({
  subjects, value, onChange, colors,
}: {
  subjects: Subject[];
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  colors: any;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
      <ChipBtn
        label="بدون مادة"
        active={value === undefined}
        onPress={() => onChange(undefined)}
        colors={colors}
      />
      {subjects.map((s) => (
        <ChipBtn
          key={s.id}
          label={s.name}
          active={value === s.id}
          onPress={() => onChange(s.id)}
          colors={colors}
        />
      ))}
      {subjects.length === 0 && (
        <Text style={[styles.chipsHint, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
          أضف مواد من تبويب المهام
        </Text>
      )}
    </ScrollView>
  );
}

function ChipBtn({ label, active, onPress, colors }: { label: string; active: boolean; onPress: () => void; colors: any }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, {
        backgroundColor: active ? colors.foreground : colors.surface,
        borderColor: active ? colors.foreground : colors.border,
      }]}
    >
      <Text style={[styles.chipText, {
        color: active ? colors.background : colors.foreground,
        fontFamily: active ? arabicFontHeavy : arabicFont,
      }]}>{label}</Text>
    </Pressable>
  );
}

function RecordingRow({
  rec, isActive, colors, onPlayToggle, onRename, onDelete,
}: {
  rec: Recording;
  isActive: boolean;
  colors: any;
  onPlayToggle: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.recRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Pressable
        onPress={onPlayToggle}
        style={[styles.playBtn, { backgroundColor: isActive ? colors.foreground : colors.surface, borderColor: colors.border }]}
      >
        <Feather
          name={isActive ? "pause" : "play"}
          size={16}
          color={isActive ? colors.background : colors.foreground}
        />
      </Pressable>

      <View style={styles.recBody}>
        <Text
          style={[styles.recName, { color: colors.foreground, fontFamily: arabicFontBold }]}
          numberOfLines={2}
        >
          {rec.name}
        </Text>
        <Text style={[styles.recMeta, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
          {formatDuration(rec.durationMs)} · {formatBytes(rec.sizeBytes)} ·{" "}
          {new Date(rec.createdAt).toLocaleString("ar-EG", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        {isActive && <PlayerBar rec={rec} colors={colors} />}
      </View>

      <View style={styles.recActions}>
        <Pressable onPress={onRename} hitSlop={8} style={styles.iconBtn}>
          <Feather name="edit-2" size={14} color={colors.mutedForeground} />
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={8} style={styles.iconBtn}>
          <Feather name="trash-2" size={14} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </View>
  );
}

function PlayerBar({ rec, colors }: { rec: Recording; colors: any }) {
  const player = useAudioPlayer({ uri: rec.uri });
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(rec.durationMs / 1000);

  useEffect(() => {
    let mounted = true;
    try {
      player.play();
    } catch {
      // ignore
    }
    const interval = setInterval(() => {
      if (!mounted) return;
      try {
        const c = (player as any).currentTime ?? 0;
        const d = (player as any).duration ?? rec.durationMs / 1000;
        setPos(c);
        setDur(d || rec.durationMs / 1000);
      } catch {
        // ignore
      }
    }, 200);
    return () => {
      mounted = false;
      clearInterval(interval);
      try { player.pause(); } catch {}
    };
  }, [player, rec.durationMs]);

  const pct = dur > 0 ? Math.min(100, (pos / dur) * 100) : 0;

  return (
    <View style={styles.playerBar}>
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.foreground, width: `${pct}%` }]} />
      </View>
      <View style={styles.timeRow}>
        <Text style={[styles.timeText, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
          {formatDuration(pos * 1000)}
        </Text>
        <Text style={[styles.timeText, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
          {formatDuration(dur * 1000)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  recorderArea: { alignItems: "center", paddingVertical: 24, gap: 4 },
  timer: { fontSize: 52, letterSpacing: -1, fontVariant: ["tabular-nums"] },
  timerLabel: { fontSize: 12, letterSpacing: 1 },
  recordBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontSize: 11,
    marginTop: 18,
    paddingHorizontal: 32,
    textAlign: "center",
    lineHeight: 18,
  },
  errorPill: {
    marginTop: 12,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  errorPillText: { fontSize: 11 },

  listSection: { flex: 1, paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  listHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  listTitle: { fontSize: 16 },
  listCount: { fontSize: 11 },
  listScroll: { gap: 14 },

  group: { gap: 6 },
  groupHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  groupTitle: { fontSize: 13, flex: 1, textAlign: "right" },
  groupCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  groupCountText: { fontSize: 10 },

  recRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  recBody: { flex: 1, gap: 2 },
  recName: { fontSize: 13, lineHeight: 20, textAlign: "right" },
  recMeta: { fontSize: 10, textAlign: "right" },
  recActions: { flexDirection: "row", gap: 4 },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  playerBar: { marginTop: 8, gap: 4 },
  progressTrack: { height: 3, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  timeRow: { flexDirection: "row-reverse", justifyContent: "space-between" },
  timeText: { fontSize: 9, fontVariant: ["tabular-nums"] },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#444",
    alignSelf: "center",
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: "row-reverse",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalTitle: { fontSize: 18 },
  modalDur: { fontSize: 12, fontVariant: ["tabular-nums"] },
  fieldLabel: { fontSize: 11, textAlign: "right", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    textAlign: "right",
  },
  chipsRow: { flexDirection: "row-reverse", gap: 8, paddingVertical: 4 },
  chipsHint: { fontSize: 11, paddingHorizontal: 8, alignSelf: "center" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 12 },
  modalActions: {
    flexDirection: "row-reverse",
    gap: 10,
    marginTop: 18,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnPrimaryText: { fontSize: 14 },
  btnGhost: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  btnGhostText: { fontSize: 13 },
});
