import { ConfirmSheet } from "@/components/ConfirmSheet";
import { DoseCell } from "@/components/DoseCell";
import { WeekDots } from "@/components/WeekDots";
import { ColorTokens } from "@/constants/Colors";
import { getRitualIcon } from "@/constants/ritualIcons";
import { useRituals } from "@/context/RitualContext";
import { useColors } from "@/hooks/useColors";
import { useToday } from "@/hooks/useToday";
import { computeStreak } from "@/utils/streak";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Pencil, Trash } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RitualDetailScreen() {
  const router = useRouter();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { rituals, toggleCompleted, deleteRitual } = useRituals();
  const ritual = rituals.find((r) => r.id === id);
  const today = useToday();
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Read straight from the saved ritual so Today, History and this screen always agree.
  const taken = ritual?.completedDates.includes(today) ?? false;
  const streak = ritual ? computeStreak(ritual.completedDates, today) : 0;

  const handleConfirmDelete = () => {
    if (!ritual) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setConfirmOpen(false);
    router.back();
    deleteRitual(ritual.id);
  };

  if (!ritual) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Ritual not found.</Text>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { Icon } = getRitualIcon(ritual.icon);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Pressable
            style={styles.back}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back to Today"
          >
            <ChevronLeft size={22} color={c.ink} strokeWidth={2} />
            <Text style={styles.backText}>Today</Text>
          </Pressable>

          <Pressable
            style={styles.edit}
            onPress={() => router.push({ pathname: "/create", params: { id: ritual.id } })}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${ritual.name}`}
          >
            <Pencil size={18} color={c.ink} strokeWidth={2} />
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        </View>

        <Text style={styles.title} accessibilityRole="header">
          {ritual.name}
        </Text>
        <Text style={styles.meta}>{streak > 0 ? `${streak} day streak` : "No streak yet"}</Text>

        <View style={styles.bigWrap}>
          <DoseCell
            size={112}
            ripple
            done={taken}
            openFill={c.well}
            open={<Icon size={44} color={c.inkMuted} strokeWidth={1.75} />}
            onPress={() => toggleCompleted(ritual.id, today)}
            accessibilityLabel={taken ? "Taken today" : "Mark as taken today"}
            accessibilityHint={taken ? "Double tap to undo" : undefined}
          />
          <Text style={styles.bigLabel}>{taken ? "Taken today" : "Press to take"}</Text>
        </View>

        <Text style={styles.sectionLabel}>This week</Text>
        <WeekDots
          ritual={ritual}
          today={today}
          onToggleDate={(date) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleCompleted(ritual.id, date);
          }}
        />

        {ritual.note.trim().length > 0 && (
          <>
            <Text style={[styles.sectionLabel, styles.noteLabel]}>Note</Text>
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>{ritual.note}</Text>
            </View>
          </>
        )}

        <Pressable
          style={styles.deleteButton}
          onPress={() => setConfirmOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${ritual.name}`}
          accessibilityHint="Asks for confirmation first"
        >
          <Trash size={18} color={c.ink} strokeWidth={2} />
          <Text style={styles.deleteText}>Delete ritual</Text>
        </Pressable>
      </ScrollView>

      <ConfirmSheet
        visible={confirmOpen}
        title={`Delete "${ritual.name}"?`}
        message="Its history will be removed too. This can't be undone."
        cancelLabel="Keep it"
        confirmLabel="Delete ritual"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
      />
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
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 8,
    },
    back: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      minHeight: 44,
      marginLeft: -6,
    },
    backText: {
      fontSize: 15,
      fontWeight: "600",
      color: c.ink,
    },
    edit: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      minHeight: 44,
      paddingHorizontal: 16,
      borderRadius: 22,
      backgroundColor: c.well,
    },
    editText: {
      fontSize: 15,
      fontWeight: "600",
      color: c.ink,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: c.ink,
      letterSpacing: -0.5,
      marginTop: 4,
    },
    meta: {
      fontSize: 14,
      color: c.inkMuted,
      marginTop: 4,
      fontVariant: ["tabular-nums"],
    },
    bigWrap: {
      alignItems: "center",
      gap: 12,
      marginTop: 28,
      marginBottom: 28,
    },
    bigLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: c.ink,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: c.inkMuted,
      marginBottom: 10,
    },
    noteLabel: {
      marginTop: 24,
    },
    noteBox: {
      backgroundColor: c.well,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 13,
    },
    noteText: {
      fontSize: 15,
      lineHeight: 21,
      color: c.ink,
    },
    deleteButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      minHeight: 52,
      borderRadius: 26,
      borderWidth: 1.5,
      borderColor: c.inkMuted,
      marginTop: 40,
    },
    deleteText: {
      fontSize: 16,
      fontWeight: "700",
      color: c.ink,
    },
    notFound: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    notFoundText: {
      fontSize: 16,
      color: c.ink,
    },
  });
}
