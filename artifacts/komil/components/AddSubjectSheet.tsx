import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { arabicFont, arabicFontBold } from "@/constants/typography";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: { name: string; instructor?: string; shade: string }) => void;
}

const SHADES = ["#FAFAFA", "#CFCFCF", "#A0A0A0", "#7D7D7D", "#5C5C5C", "#3D3D3D"];

export function AddSubjectSheet({ visible, onClose, onSubmit }: Props) {
  const colors = useColors();
  const [name, setName] = useState("");
  const [instructor, setInstructor] = useState("");
  const [shade, setShade] = useState(SHADES[0]!);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      instructor: instructor.trim() || undefined,
      shade,
    });
    setName("");
    setInstructor("");
    setShade(SHADES[0]!);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropTap} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.handle}>
            <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground, fontFamily: arabicFontBold }]}>
              مادة جديدة
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <View style={styles.body}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                اسم المادة
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="مثال: تفاضل وتكامل"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface3,
                    color: colors.foreground,
                    borderColor: colors.border,
                    fontFamily: arabicFont,
                  },
                ]}
                autoFocus
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                اسم الدكتور (اختياري)
              </Text>
              <TextInput
                value={instructor}
                onChangeText={setInstructor}
                placeholder="د. ..."
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface3,
                    color: colors.foreground,
                    borderColor: colors.border,
                    fontFamily: arabicFont,
                  },
                ]}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: arabicFont }]}>
                لون التمييز
              </Text>
              <View style={styles.shadesRow}>
                {SHADES.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setShade(s)}
                    style={[
                      styles.shadeDot,
                      {
                        backgroundColor: s,
                        borderColor: shade === s ? colors.foreground : "transparent",
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              onPress={handleSubmit}
              disabled={!name.trim()}
              style={({ pressed }) => [
                styles.submitBtn,
                {
                  backgroundColor: colors.foreground,
                  opacity: !name.trim() ? 0.4 : pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={[styles.submitText, { color: colors.background, fontFamily: arabicFontBold }]}>
                حفظ المادة
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  backdropTap: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  handle: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
  },
  body: {
    padding: 18,
    gap: 18,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 12,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 15,
    textAlign: "right",
  },
  shadesRow: {
    flexDirection: "row",
    gap: 12,
  },
  shadeDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
  },
  footer: {
    padding: 18,
    borderTopWidth: 1,
  },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },
  submitText: {
    fontSize: 15,
  },
});
