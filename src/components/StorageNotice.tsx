import { ColorTokens } from '@/constants/Colors';
import { StorageNoticeKind, useRituals } from '@/context/RitualContext';
import { useColors } from '@/hooks/useColors';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MESSAGES: Record<StorageNoticeKind, string> = {
  'save-failed': "Couldn't save your latest changes.",
  newer: 'Your data was saved by a newer Day Book. Update the app to open it. Changes are not saved.',
  'read-failed': "Couldn't open your saved data. Changes are not saved. Close and reopen the app.",
  unreadable: "Your saved data couldn't be read, so Day Book started empty. A copy was kept.",
};

// A quiet bar at the top of the screen. It stays until the problem is gone or, for the info one, is dismissed.
export function StorageNotice() {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const insets = useSafeAreaInsets();
  const { storageNotice, retrySave, dismissNotice } = useRituals();

  if (storageNotice === null) return null;

  const action =
    storageNotice === 'save-failed'
      ? { label: 'Try again', run: retrySave }
      : storageNotice === 'unreadable'
        ? { label: 'OK', run: dismissNotice }
        : null;

  return (
    <View
      style={[styles.bar, { top: insets.top + 8 }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.text}>{MESSAGES[storageNotice]}</Text>
      {action && (
        <Pressable
          style={styles.action}
          onPress={action.run}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Text style={styles.actionText}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    bar: {
      position: 'absolute',
      left: 16,
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 8,
      paddingLeft: 16,
      paddingRight: 8,
      minHeight: 52,
      borderRadius: 26,
      backgroundColor: c.ink,
    },
    text: {
      flex: 1,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: '600',
      color: c.ground,
    },
    action: {
      minHeight: 44,
      paddingHorizontal: 16,
      borderRadius: 22,
      backgroundColor: c.ground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionText: {
      fontSize: 14,
      fontWeight: '700',
      color: c.ink,
    },
  });
}
