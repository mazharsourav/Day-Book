import { FirstRunSteps } from "@/components/FirstRunSteps";
import { RitualRow } from "@/components/RitualRow";
import { ColorTokens } from "@/constants/Colors";
import { useAppearance } from "@/context/AppearanceContext";
import { useRituals } from "@/context/RitualContext";
import { useColors } from "@/hooks/useColors";
import { useToday } from "@/hooks/useToday";
import { fromDateString } from "@/utils/dates";
import { computeStreak } from "@/utils/streak";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Moon, Plus, Settings, Sun } from "lucide-react-native";
import { useCallback, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function getDateLabel(today: string): string {
  return fromDateString(today).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function HomeScreen() {
  const router = useRouter();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const { rituals, toggleCompleted } = useRituals();
  const { setPreference } = useAppearance();
  const today = useToday();

  // "Taken today" is derived from the saved completedDates, so every screen agrees.
  const takenCount = rituals.filter((r) => r.completedDates.includes(today)).length;
  const totalCount = rituals.length;
  const leftCount = totalCount - takenCount;
  const allTaken = totalCount > 0 && takenCount === totalCount;

  const handleToggle = useCallback(
    (id: string) => {
      toggleCompleted(id, today);
    },
    [toggleCompleted, today]
  );

  const handlePress = useCallback(
    (id: string) => {
      router.push(`/ritual/${id}`);
    },
    [router]
  );

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/create");
  };

  // One tap flips between Light and Dark. A long press hands control back to the phone.
  const isDark = c.scheme === "dark";
  const handleAppearance = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreference(isDark ? "light" : "dark");
  };
  const handleMatchPhone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPreference("system");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.date}>{getDateLabel(today)}</Text>
            <Text style={styles.title} accessibilityRole="header">
              Today
            </Text>
          </View>
          <View style={styles.actions}>
            <Pressable
              style={styles.roundButton}
              onPress={handleAdd}
              accessibilityRole="button"
              accessibilityLabel="Add a ritual"
            >
              <Plus size={22} color={c.ink} strokeWidth={2} />
            </Pressable>
            <Pressable
              style={styles.roundButton}
              onPress={handleAppearance}
              onLongPress={handleMatchPhone}
              accessibilityRole="button"
              accessibilityLabel={isDark ? "Switch to light mode" : "Switch to dark mode"}
              accessibilityHint="Long press to match your phone's setting"
              accessibilityActions={[{ name: "longpress", label: "Match phone setting" }]}
              onAccessibilityAction={(e) => {
                if (e.nativeEvent.actionName === "longpress") handleMatchPhone();
              }}
            >
              {isDark ? (
                <Sun size={22} color={c.ink} strokeWidth={2} />
              ) : (
                <Moon size={22} color={c.ink} strokeWidth={2} />
              )}
            </Pressable>
            <Pressable
              style={styles.roundButton}
              onPress={() => router.push("/settings")}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <Settings size={22} color={c.ink} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        {totalCount > 0 && (
          <View style={styles.summary}>
            <Text style={styles.count}>
              {allTaken ? `All ${totalCount} taken` : `${takenCount} of ${totalCount} taken`}
            </Text>
            <Text style={styles.left}>{allTaken ? "See you tomorrow" : `${leftCount} left`}</Text>
          </View>
        )}

        <FlatList
          data={rituals}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<FirstRunSteps onAdd={handleAdd} />}
          renderItem={({ item }) => (
            <RitualRow
              ritual={item}
              isCompletedToday={item.completedDates.includes(today)}
              streak={computeStreak(item.completedDates, today)}
              onToggle={handleToggle}
              onPress={handlePress}
            />
          )}
          contentContainerStyle={[styles.list, rituals.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.ground,
    },
    container: {
      flex: 1,
      paddingHorizontal: 20,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingTop: 22,
    },
    headerText: {
      flex: 1,
    },
    date: {
      fontSize: 13,
      fontWeight: "500",
      color: c.inkMuted,
    },
    title: {
      fontSize: 32,
      fontWeight: "700",
      color: c.ink,
      letterSpacing: -0.6,
      marginTop: 2,
    },
    actions: {
      flexDirection: "row",
      gap: 8,
    },
    roundButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.well,
      alignItems: "center",
      justifyContent: "center",
    },
    summary: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginTop: 20,
      marginBottom: 6,
    },
    count: {
      fontSize: 17,
      fontWeight: "700",
      color: c.ink,
      fontVariant: ["tabular-nums"],
    },
    left: {
      fontSize: 13,
      color: c.inkMuted,
      fontVariant: ["tabular-nums"],
    },
    list: {
      paddingBottom: 24,
    },
    listEmpty: {
      flexGrow: 1,
    },
  });
}
