import { DarkTheme, Stack, ThemeProvider } from "expo-router";

import { NotificationRouter } from "@/components/NotificationRouter";
import { ThemeFade } from "@/components/ThemeFade";
import { AppearanceProvider } from "@/context/AppearanceContext";
import { ReminderProvider } from "@/context/ReminderContext";
import { DataProvider } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useReducedMotion } from "react-native-reanimated";

export const unstable_settings = {
  anchor: '(tabs)'
}

// Lives inside the providers so it can read the mode that is showing.
function ThemedNavigation() {
  const c = useColors();
  // A pushed screen slides in from the right (motion table); with Reduce Motion it fades.
  const reduceMotion = useReducedMotion();
  const push = reduceMotion ? 'fade' : 'slide_from_right';

  // Navigation chrome follows the light or dark tokens, not the stock themes.
  const theme = useMemo(
    () => ({
      ...DarkTheme,
      dark: c.scheme === "dark",
      colors: {
        ...DarkTheme.colors,
        primary: c.text,
        background: c.ground,
        card: c.ground,
        text: c.text,
        border: c.line,
        notification: c.accent,
      },
    }),
    [c]
  );

  return (
    <ThemeProvider value={theme}>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: c.ground },
          headerShown: false,
        }}
      >
        <Stack.Screen name='(tabs)' />
        <Stack.Screen name='ritual/[id]' options={{ animation: push }} />
        <Stack.Screen name='how-it-works' options={{ animation: push }} />
        {/* The form draws its own dimmed background and card, so the screen behind stays visible. */}
        <Stack.Screen
          name='create'
          options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }}
        />
        <Stack.Screen
          name='task'
          options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }}
        />
        <Stack.Screen
          name='share-month'
          options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }}
        />
      </Stack>
      <NotificationRouter />
      <ThemeFade />
      <StatusBar style={c.scheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  // Gestures (dragging a task on Week) only work inside this root view.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppearanceProvider>
        <DataProvider>
          <ReminderProvider>
            <ThemedNavigation />
          </ReminderProvider>
        </DataProvider>
      </AppearanceProvider>
    </GestureHandlerRootView>
  );
}
