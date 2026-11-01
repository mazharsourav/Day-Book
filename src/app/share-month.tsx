import { MonthShareCard } from "@/components/MonthShareCard";
import { ColorTokens, darkColors, lightColors } from "@/constants/Colors";
import { useRituals } from "@/context/RitualContext";
import { useColors } from "@/hooks/useColors";
import { useToday } from "@/hooks/useToday";
import { MONTH_NAMES, MonthView } from "@/utils/calendar";
import { fromDateString } from "@/utils/dates";
import { buildMonthCard, monthCardSummary } from "@/utils/monthCard";
import { shareCardImage } from "@/utils/shareImage";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Share } from "lucide-react-native";
import { useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// The card is chosen from History's month, passed as ?year=2026&month=8 (month 0 is January).
export default function ShareMonthScreen() {
  const router = useRouter();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const params = useLocalSearchParams<{ year?: string; month?: string }>();
  const { rituals } = useRituals();
  const today = useToday();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const year = Number(params.year);
  const month = Number(params.month);
  const todayDate = fromDateString(today);
  const valid = Number.isInteger(year) && Number.isInteger(month) && month >= 0 && month <= 11;
  const view: MonthView = valid
    ? { year, month }
    : { year: todayDate.getFullYear(), month: todayDate.getMonth() };

  const model = buildMonthCard(rituals, view, today);
  const title = `${MONTH_NAMES[view.month]} ${view.year}`;
  const summary = monthCardSummary(model);

  // The card starts in the mode the app is in. The choice only affects the picture.
  const [look, setLook] = useState<"light" | "dark">(c.scheme);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const cardRef = useRef<View>(null);

  const cardWidth = Math.max(160, Math.min(screenWidth - 40, 260, ((screenHeight - 360) * 9) / 16));
  const monthNumber = String(view.month + 1).padStart(2, "0");

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessage(null);
    setBusy(true);
    try {
      const result = await shareCardImage(cardRef, `daybook-${view.year}-${monthNumber}.png`);
      if (result === "unavailable") setMessage("Sharing isn't available on this device.");
    } catch {
      setMessage("Couldn't create the picture. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.close}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
          <Text style={styles.title} accessibilityRole="header">
            Share month
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.stage}>
          <View style={styles.frame}>
            <View ref={cardRef} collapsable={false}>
              <MonthShareCard
                model={model}
                title={title}
                summary={summary}
                colors={look === "dark" ? darkColors : lightColors}
                width={cardWidth}
              />
            </View>
          </View>
        </View>

        <Text style={styles.label}>Look</Text>
        <View style={styles.segment}>
          {(["light", "dark"] as const).map((value) => {
            const selected = look === value;
            return (
              <Pressable
                key={value}
                style={[styles.segmentButton, selected && styles.segmentButtonOn]}
                onPress={() => setLook(value)}
                accessibilityRole="button"
                accessibilityLabel={value === "light" ? "Light card" : "Dark card"}
                accessibilityState={{ selected }}
              >
                <Text style={[styles.segmentText, selected && styles.segmentTextOn]}>
                  {value === "light" ? "Light" : "Dark"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.primary, busy && styles.dimmed]}
          onPress={handleShare}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Share image"
        >
          <Share size={18} color={c.ground} strokeWidth={2} />
          <Text style={styles.primaryText}>Share image</Text>
        </Pressable>

        {message !== null && (
          <View style={styles.messageBox} accessibilityLiveRegion="polite">
            <Text style={styles.messageText}>{message}</Text>
          </View>
        )}

        <Text style={styles.note}>
          Made on your phone. It shows the dots and the month, never your ritual names or notes.
        </Text>
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
      paddingBottom: 40,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 52,
      marginTop: 8,
      marginBottom: 8,
    },
    close: {
      minHeight: 44,
      minWidth: 60,
      justifyContent: "center",
    },
    closeText: {
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
    stage: {
      alignItems: "center",
      marginTop: 8,
      marginBottom: 24,
    },
    // A hairline edge so a light card is still visible on a light screen. It is not part of the picture.
    frame: {
      borderWidth: 1,
      borderColor: c.hairline,
      borderRadius: 14,
      overflow: "hidden",
    },
    label: {
      fontSize: 13,
      fontWeight: "700",
      color: c.inkMuted,
      marginBottom: 8,
    },
    segment: {
      flexDirection: "row",
      gap: 8,
    },
    segmentButton: {
      minHeight: 44,
      paddingHorizontal: 20,
      borderRadius: 22,
      backgroundColor: c.well,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentButtonOn: {
      backgroundColor: c.ink,
    },
    segmentText: {
      fontSize: 15,
      fontWeight: "600",
      color: c.ink,
    },
    segmentTextOn: {
      color: c.ground,
    },
    primary: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      minHeight: 52,
      borderRadius: 26,
      backgroundColor: c.ink,
      marginTop: 24,
    },
    primaryText: {
      fontSize: 16,
      fontWeight: "700",
      color: c.ground,
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
    note: {
      fontSize: 13,
      lineHeight: 18,
      color: c.inkMuted,
      textAlign: "center",
      marginTop: 16,
    },
  });
}
