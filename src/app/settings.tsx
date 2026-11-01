import { ConfirmSheet } from "@/components/ConfirmSheet";
import { ColorTokens } from "@/constants/Colors";
import { useReminder } from "@/context/ReminderContext";
import { useRituals } from "@/context/RitualContext";
import { useColors } from "@/hooks/useColors";
import { Ritual } from "@/types";
import { backupFileName, buildBackup, parseBackup } from "@/utils/backup";
import { exportBackupFile, pickBackupText } from "@/utils/backupFiles";
import { openPhoneSettings } from "@/utils/reminderNotifications";
import { REMINDER_TIME_LABEL } from "@/utils/reminderPlan";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Bell, ChevronLeft, Download, Upload } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ChosenBackup {
  rituals: Ritual[];
  exportedAt: string | null;
  dropped: number;
}

const REFUSALS = {
  unreadable: "That file can't be read as a backup. Choose a file saved by Day Book.",
  "not-backup": "That isn't a Day Book backup file. Choose a file saved by Day Book.",
  newer: "That backup is from a newer version of Day Book. Update the app, then try again.",
} as const;

const BLOCKED = "Notifications are off for Day Book. Turn them on in your phone's settings.";

function countLabel(n: number): string {
  return `${n} ${n === 1 ? "ritual" : "rituals"}`;
}

export default function SettingsScreen() {
  const router = useRouter();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const { rituals, replaceAll, canSave } = useRituals();
  const reminder = useReminder();

  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [chosen, setChosen] = useState<ChosenBackup | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const blocked = reminder.supported && reminder.permission === "denied" && reminder.enabled;

  const handleSwitch = async (on: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReminderMessage(null);
    const result = await reminder.setEnabled(on);
    if (result === "denied") setReminderMessage(BLOCKED);
  };

  const handleTest = async () => {
    setReminderMessage(null);
    try {
      const result = await reminder.sendTest();
      setReminderMessage(
        result === "denied"
          ? BLOCKED
          : "A test reminder is on its way. It arrives in about 10 seconds."
      );
    } catch {
      setReminderMessage("Couldn't send a test reminder. Try again.");
    }
  };

  const handleSave = async () => {
    setMessage(null);
    setBusy(true);
    try {
      const result = await exportBackupFile(buildBackup(rituals), backupFileName());
      if (result === "unavailable") setMessage("Sharing isn't available on this device.");
    } catch {
      setMessage("Couldn't create the backup file. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleChoose = async () => {
    setMessage(null);
    try {
      const text = await pickBackupText();
      if (text === null) return;
      const result = parseBackup(text);
      if (!result.ok) {
        setMessage(REFUSALS[result.reason]);
        return;
      }
      setChosen(result);
      setConfirmOpen(true);
    } catch {
      setMessage("Couldn't read that file. Try another one.");
    }
  };

  const handleRestore = () => {
    if (!chosen) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    replaceAll(chosen.rituals);
    setConfirmOpen(false);
    const skipped =
      chosen.dropped > 0
        ? ` ${chosen.dropped} damaged ${chosen.dropped === 1 ? "entry was" : "entries were"} skipped.`
        : "";
    setMessage(`Restored ${countLabel(chosen.rituals.length)}.${skipped}`);
  };

  const exportedOn = chosen?.exportedAt
    ? new Date(chosen.exportedAt).toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "an unknown date";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.back}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to Today"
        >
          <ChevronLeft size={22} color={c.ink} strokeWidth={2} />
          <Text style={styles.backText}>Today</Text>
        </Pressable>

        <Text style={styles.title} accessibilityRole="header">
          Settings
        </Text>

        <Text style={styles.sectionLabel}>Daily reminder</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Remind me at {REMINDER_TIME_LABEL}</Text>
          <Switch
            value={reminder.enabled}
            onValueChange={handleSwitch}
            disabled={!reminder.supported}
            trackColor={{ false: c.hairline, true: c.done }}
            thumbColor={c.ground}
            accessibilityLabel={`Remind me at ${REMINDER_TIME_LABEL}`}
          />
        </View>
        <Text style={styles.body}>
          {reminder.supported
            ? "One reminder if any rituals are still open, with how many are left. Nothing is sent once you have taken them all."
            : "Reminders work in the phone app, not in a browser."}
        </Text>

        {(blocked || reminderMessage === BLOCKED) && (
          <Pressable
            style={styles.secondary}
            onPress={() => openPhoneSettings()}
            accessibilityRole="button"
            accessibilityLabel="Open phone settings"
          >
            <Text style={styles.secondaryText}>Open phone settings</Text>
          </Pressable>
        )}

        {reminder.supported && (
          <Pressable
            style={[styles.secondary, styles.stacked]}
            onPress={handleTest}
            accessibilityRole="button"
            accessibilityLabel="Send a test reminder"
          >
            <Bell size={18} color={c.ink} strokeWidth={2} />
            <Text style={styles.secondaryText}>Send a test reminder</Text>
          </Pressable>
        )}

        {reminderMessage !== null && (
          <View style={styles.messageBox} accessibilityLiveRegion="polite">
            <Text style={styles.messageText}>{reminderMessage}</Text>
          </View>
        )}

        <Text style={[styles.sectionLabel, styles.nextSection]}>Backup</Text>
        <Text style={styles.meta}>{countLabel(rituals.length)} on this phone</Text>
        <Text style={styles.body}>
          Makes one file with every ritual, its history and its note. Send it to Drive or email it to
          yourself, so your data survives a lost phone.
        </Text>
        <Pressable
          style={[styles.primary, busy && styles.dimmed]}
          onPress={handleSave}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Save a backup"
        >
          <Download size={18} color={c.ground} strokeWidth={2} />
          <Text style={styles.primaryText}>Save a backup</Text>
        </Pressable>

        <Text style={styles.body2}>
          {canSave
            ? "Restore from a backup file. It replaces everything now in the app."
            : "Restore is off until your saved data can be read again."}
        </Text>
        <Pressable
          style={[styles.secondary, !canSave && styles.dimmed]}
          onPress={handleChoose}
          disabled={!canSave}
          accessibilityRole="button"
          accessibilityLabel="Choose a backup file"
        >
          <Upload size={18} color={c.ink} strokeWidth={2} />
          <Text style={styles.secondaryText}>Choose a backup file</Text>
        </Pressable>

        {message !== null && (
          <View style={styles.messageBox} accessibilityLiveRegion="polite">
            <Text style={styles.messageText}>{message}</Text>
          </View>
        )}
      </ScrollView>

      <ConfirmSheet
        visible={confirmOpen}
        title="Replace your data?"
        message={`This backup has ${countLabel(chosen?.rituals.length ?? 0)}, saved on ${exportedOn}. Day Book has ${countLabel(rituals.length)} now. Restoring replaces them.`}
        cancelLabel="Keep current data"
        confirmLabel="Replace with backup"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleRestore}
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
    back: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      minHeight: 44,
      marginTop: 8,
      marginLeft: -6,
    },
    backText: {
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
      marginBottom: 8,
      fontVariant: ["tabular-nums"],
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: c.inkMuted,
      marginTop: 28,
      marginBottom: 8,
    },
    nextSection: {
      marginTop: 44,
    },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 52,
      gap: 12,
    },
    switchText: {
      flex: 1,
      fontSize: 17,
      fontWeight: "600",
      color: c.ink,
    },
    body: {
      fontSize: 15,
      lineHeight: 21,
      color: c.ink,
      marginTop: 4,
      marginBottom: 16,
    },
    body2: {
      fontSize: 15,
      lineHeight: 21,
      color: c.ink,
      marginTop: 24,
      marginBottom: 16,
    },
    primary: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      minHeight: 52,
      borderRadius: 26,
      backgroundColor: c.ink,
    },
    primaryText: {
      fontSize: 16,
      fontWeight: "700",
      color: c.ground,
    },
    secondary: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      minHeight: 52,
      borderRadius: 26,
      backgroundColor: c.well,
    },
    stacked: {
      marginTop: 10,
    },
    secondaryText: {
      fontSize: 16,
      fontWeight: "700",
      color: c.ink,
    },
    dimmed: {
      opacity: 0.45,
    },
    messageBox: {
      marginTop: 16,
      padding: 14,
      borderRadius: 14,
      backgroundColor: c.well,
    },
    messageText: {
      fontSize: 15,
      lineHeight: 21,
      color: c.ink,
    },
  });
}
