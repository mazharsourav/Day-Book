import { DarkTheme, Stack, ThemeProvider } from "expo-router";

import { StorageNotice } from "@/components/StorageNotice";
import { AppearanceProvider } from "@/context/AppearanceContext";
import { ReminderProvider } from "@/context/ReminderContext";
import { RitualsProvider } from "@/context/RitualContext";
import { useColors } from "@/hooks/useColors";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";

export const unstable_settings = {
  anchor: '(tabs)'
}

// Lives inside the providers so it can read the mode that is showing.
function ThemedNavigation() {
  const c = useColors();

  // Navigation chrome follows the light or dark tokens, not the stock themes.
  const theme = useMemo(
    () => ({
      ...DarkTheme,
      dark: c.scheme === "dark",
      colors: {
        ...DarkTheme.colors,
        primary: c.ink,
        background: c.ground,
        card: c.ground,
        text: c.ink,
        border: c.hairline,
        notification: c.done,
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
        <Stack.Screen name='ritual/[id]' />
        <Stack.Screen name='create' options={{ presentation: 'modal' }} />
        <Stack.Screen name='settings' />
        <Stack.Screen name='share-month' options={{ presentation: 'modal' }} />
      </Stack>
      <StorageNotice />
      <StatusBar style={c.scheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppearanceProvider>
      <RitualsProvider>
        <ReminderProvider>
          <ThemedNavigation />
        </ReminderProvider>
      </RitualsProvider>
    </AppearanceProvider>
  );
}
