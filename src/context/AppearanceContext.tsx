import { darkColors, lightColors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme, View } from 'react-native';

export type AppearancePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'daybook:appearance';

interface AppearanceContextValue {
  // What the person chose. 'system' means follow the phone.
  preference: AppearancePreference;
  // What is actually showing right now.
  scheme: 'light' | 'dark';
  setPreference: (preference: AppearancePreference) => void;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

// Lets the person pick Light, Dark, or follow the phone. The choice is saved on the device.
// The colors come from this state, not from the operating system override, so it behaves
// the same on Android, iOS and web (react-native-web has no setColorScheme).
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<AppearancePreference>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setPreferenceState(saved);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const setPreference = useCallback((next: AppearancePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const deviceScheme: 'light' | 'dark' = systemScheme === 'dark' ? 'dark' : 'light';
  const scheme = preference === 'system' ? deviceScheme : preference;

  // Wait for the saved choice so the app never flashes the wrong mode on launch.
  if (!loaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: deviceScheme === 'dark' ? darkColors.ground : lightColors.ground,
        }}
      />
    );
  }

  return (
    <AppearanceContext.Provider value={{ preference, scheme, setPreference }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error('useAppearance must be used within AppearanceProvider');
  return ctx;
}
