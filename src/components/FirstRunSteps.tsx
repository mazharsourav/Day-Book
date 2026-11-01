import { ColorTokens } from '@/constants/Colors';
import { useColors } from '@/hooks/useColors';
import { Calendar, Check, LucideIcon, Plus } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface FirstRunStepsProps {
  onAdd: () => void;
}

const STEPS: { Icon: LucideIcon; done: boolean; title: string; body: string }[] = [
  { Icon: Plus, done: false, title: 'Add a ritual', body: 'A name and an icon is all it needs.' },
  { Icon: Check, done: true, title: 'Press its circle', body: 'Every day you do it.' },
  { Icon: Calendar, done: false, title: 'Watch the month fill in', body: 'History shows every day you kept.' },
];

// Shown on Today until the first ritual exists: what the app does, in three lines.
export function FirstRunSteps({ onAdd }: FirstRunStepsProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading} accessibilityRole="header">
        How Day Book works
      </Text>

      <View style={styles.steps}>
        {STEPS.map(({ Icon, done, title, body }) => (
          <View key={title} style={styles.step} accessible accessibilityLabel={`${title}. ${body}`}>
            <View style={[styles.cell, done ? styles.cellDone : styles.cellOpen]}>
              <Icon size={20} color={done ? c.onDone : c.inkMuted} strokeWidth={done ? 2.75 : 2} />
            </View>
            <View style={styles.stepText}>
              <Text style={styles.stepTitle}>{title}</Text>
              <Text style={styles.stepBody}>{body}</Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable
        style={styles.button}
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel="Add your first ritual"
      >
        <Plus size={20} color={c.ground} strokeWidth={2.25} />
        <Text style={styles.buttonText}>Add your first ritual</Text>
      </Pressable>
    </View>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
      paddingTop: 36,
      paddingBottom: 16,
    },
    heading: {
      fontSize: 22,
      fontWeight: '700',
      color: c.ink,
      letterSpacing: -0.3,
    },
    steps: {
      marginTop: 24,
      gap: 20,
    },
    step: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    cell: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cellOpen: {
      backgroundColor: c.well,
      boxShadow: `inset 0px 2px 3px ${c.inset}`,
    },
    cellDone: {
      backgroundColor: c.done,
      boxShadow: '0px 1px 1px rgba(0, 0, 0, 0.18)',
    },
    stepText: {
      flex: 1,
    },
    stepTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.ink,
    },
    stepBody: {
      fontSize: 14,
      lineHeight: 19,
      color: c.inkMuted,
      marginTop: 1,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 52,
      borderRadius: 26,
      backgroundColor: c.ink,
      marginTop: 'auto',
    },
    buttonText: {
      fontSize: 17,
      fontWeight: '700',
      color: c.ground,
    },
  });
}
