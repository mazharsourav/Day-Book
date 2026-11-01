import { IconPicker } from "@/components/IconPicker";
import { ColorTokens } from "@/constants/Colors";
import { useRituals } from "@/context/RitualContext";
import { useColors } from "@/hooks/useColors";
import { RitualIconType } from "@/types";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Used for both "New ritual" and, when an id is passed, "Edit ritual".
export default function CreateRitualScreen() {
  const router = useRouter();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { rituals, addRitual, updateRitual } = useRituals();

  const existing = id ? rituals.find((r) => r.id === id) : undefined;
  const isEdit = existing !== undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [icon, setIcon] = useState<RitualIconType>(existing?.icon ?? "flame");
  const [note, setNote] = useState(existing?.note ?? "");
  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (existing) {
      updateRitual(existing.id, { name: name.trim(), icon, note: note.trim() });
    } else {
      addRitual({
        id: Date.now().toString(),
        name: name.trim(),
        icon,
        note: note.trim(),
        completedDates: [],
        createdAt: new Date().toISOString(),
      });
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.cancel}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            accessibilityHint="Closes without saving"
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.title} accessibilityRole="header">
            {isEdit ? "Edit ritual" : "New ritual"}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          accessibilityLabel="Ritual name"
          placeholder="Morning tea"
          placeholderTextColor={c.inkMuted}
          selectionColor={c.done}
          maxLength={40}
          autoFocus={!isEdit}
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />

        <Text style={[styles.label, styles.labelSpaced]}>Icon</Text>
        <IconPicker selected={icon} onSelect={setIcon} />

        <Text style={[styles.label, styles.labelSpaced]}>Note (optional)</Text>
        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={setNote}
          accessibilityLabel="Note"
          multiline
          placeholder="Why you do it, or anything to remember"
          placeholderTextColor={c.inkMuted}
          selectionColor={c.done}
          textAlignVertical="top"
        />

        <Pressable
          style={[styles.primary, !canSave && styles.primaryDisabled]}
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityLabel={isEdit ? "Save changes" : "Add ritual"}
          accessibilityHint={canSave ? undefined : "Enter a name first"}
          accessibilityState={{ disabled: !canSave }}
        >
          <Text style={[styles.primaryText, !canSave && styles.primaryTextDisabled]}>
            {isEdit ? "Save changes" : "Add ritual"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.ground,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 48,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 52,
      marginTop: 8,
      marginBottom: 8,
    },
    cancel: {
      minHeight: 44,
      minWidth: 60,
      justifyContent: "center",
    },
    cancelText: {
      fontSize: 16,
      color: c.ink,
    },
    title: {
      fontSize: 17,
      fontWeight: "700",
      color: c.ink,
    },
    headerSpacer: {
      minWidth: 60,
    },
    label: {
      fontSize: 13,
      fontWeight: "700",
      color: c.inkMuted,
      marginBottom: 8,
    },
    labelSpaced: {
      marginTop: 24,
    },
    nameInput: {
      backgroundColor: c.well,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 14,
      fontSize: 16,
      color: c.ink,
    },
    noteInput: {
      backgroundColor: c.well,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      lineHeight: 21,
      color: c.ink,
      minHeight: 96,
    },
    primary: {
      minHeight: 52,
      borderRadius: 26,
      backgroundColor: c.ink,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 28,
    },
    primaryDisabled: {
      backgroundColor: c.well,
    },
    primaryText: {
      fontSize: 17,
      fontWeight: "700",
      color: c.ground,
    },
    primaryTextDisabled: {
      color: c.inkMuted,
    },
  });
}
