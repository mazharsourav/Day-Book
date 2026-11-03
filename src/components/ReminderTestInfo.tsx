import { AppText } from '@/components/ui/AppText';
import { LAYOUT } from '@/constants/layout';
import { ONCE_A_DAY, useReminder } from '@/context/ReminderContext';
import { useColors } from '@/hooks/useColors';
import { getPlannedToday, getReminderTestInfo } from '@/utils/reminderNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

// TEMPORARY (Expo Go reminder test, 2026-11-03): shows what the phone has been asked to send.
// Settings shows it only in development (`__DEV__`), so it never appears in a preview or release build.
// Remove with the rest of the Expo Go test before the release.

const clock = (d: Date) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const when = (d: Date) =>
  d.toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function ReminderTestInfo() {
  const c = useColors();
  const { permission, settings, resetSentForTest } = useReminder();
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const read = async () => {
      const info = getReminderTestInfo();
      const sentRaw = await AsyncStorage.getItem('daybook:reminder-sent').catch(() => null);
      const sent = sentRaw ? (JSON.parse(sentRaw) as Record<string, { day: string; at: number } | undefined>) : {};
      const today = getPlannedToday().map(
        (e) => `${e.kind === 'evening' ? 'ritual' : 'task'} at ${clock(e.at)} (planned ${clock(e.plannedAt)})`
      );
      const next = (info?.planned ?? []).filter((p) => p.date.getTime() > Date.now()).slice(0, 3);
      const sentLine = (['evening', 'morning'] as const)
        .map((k) => `${k === 'evening' ? 'ritual' : 'task'} ${sent[k] ? when(new Date(sent[k]!.at)) : '-'}`)
        .join(', ');
      const out = [
        `Now: ${when(new Date())}`,
        `Permission: ${permission}. Ritual ${settings.evening.on ? 'on' : 'off'}, task ${settings.morning.on ? 'on' : 'off'}.`,
        info
          ? `Last planned ${when(info.plannedAt)}: ${info.planned.length} notes; the phone has ${info.scheduled ?? '?'} waiting.`
          : 'Not planned yet.',
        `Planned for today since the app opened: ${today.length ? today.join('; ') : 'none'}`,
        (() => {
          const task = (info?.planned ?? []).find((p) => p.kind === 'morning' && p.date.getTime() > Date.now());
          return task ? `Next task note: ${when(task.date)}, "${task.title}"` : 'Next task note: none planned';
        })(),
        ...next.map((p) => `Next: ${p.kind === 'evening' ? 'ritual' : 'task'} ${when(p.date)}, "${p.title}"`),
        ONCE_A_DAY ? `Counted as sent today: ${sentLine}` : 'Once a day: off for testing (any number of notes a day).',
      ];
      if (info?.error) out.push(`Error: ${info.error}`);
      if (!cancelled) setLines(out);
    };
    read();
    const id = setInterval(read, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [permission, settings]);

  return (
    <View style={{ marginTop: 12, marginHorizontal: LAYOUT.screenPadding, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: c.line, borderStyle: 'dashed' }}>
      <AppText style={{ fontSize: 12, lineHeight: 16, fontWeight: '700', color: c.muted }}>Test info (Expo Go only)</AppText>
      {lines.map((l) => (
        <AppText key={l} selectable style={{ fontSize: 12, lineHeight: 17, fontWeight: '500', color: c.muted, marginTop: 4 }}>
          {l}
        </AppText>
      ))}
      <Pressable
        onPress={() => resetSentForTest().catch(() => {})}
        accessibilityRole="button"
        style={{ marginTop: 8, minHeight: 36, justifyContent: 'center' }}
      >
        <AppText style={{ fontSize: 13, fontWeight: '600', color: c.accent }}>Forget today&apos;s sent notes and plan again</AppText>
      </Pressable>
    </View>
  );
}
