import { ColorTokens, mix } from '@/constants/Colors';
import { MonthCardModel } from '@/utils/monthCard';
import { Text, View } from 'react-native';

interface MonthShareCardProps {
  model: MonthCardModel;
  title: string;
  summary: string;
  // The card has its own light or dark look, set on the share screen.
  colors: ColorTokens;
  // Drawn width in points. Every size scales from it, and the card is always 9:16.
  width: number;
}

// The picture that is shared: one month of dots, in the same look as History.
// No ritual names and no notes, by design.
export function MonthShareCard({ model, title, summary, colors: c, width }: MonthShareCardProps) {
  const u = width / 100;
  const height = (width * 16) / 9;
  const gap = 1.6 * u;
  const cell = (86 * u - 6 * gap) / 7;
  const someFill = mix(c.done, c.ground, 0.34);

  // Weeks of seven, Monday first, padded with empty slots at both ends.
  const slots: (MonthCardModel['days'][number] | null)[] = [
    ...Array.from({ length: model.leading }, () => null),
    ...model.days,
  ];
  while (slots.length % 7 !== 0) slots.push(null);
  const weeks: (typeof slots)[] = [];
  for (let i = 0; i < slots.length; i += 7) weeks.push(slots.slice(i, i + 7));

  return (
    <View
      accessible
      accessibilityLabel={`${title}. ${summary}.`}
      style={{
        width,
        height,
        backgroundColor: c.ground,
        paddingHorizontal: 7 * u,
        paddingVertical: 14 * u,
        justifyContent: 'space-between',
      }}
    >
      <View>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            fontSize: 9 * u,
            fontWeight: '700',
            letterSpacing: -0.18 * u,
            color: c.ink,
          }}
        >
          {title}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 4.2 * u,
            color: c.inkMuted,
            marginTop: 1.5 * u,
            fontVariant: ['tabular-nums'],
          }}
        >
          {summary}
        </Text>
      </View>

      <View style={{ gap }}>
        {weeks.map((week, row) => (
          <View key={row} style={{ flexDirection: 'row', gap }}>
            {week.map((slot, col) => {
              const box = { width: cell, height: cell, borderRadius: cell / 2 };
              if (slot === null) return <View key={col} style={box} />;

              const fill =
                slot.state === 'all'
                  ? c.done
                  : slot.state === 'some'
                    ? someFill
                    : slot.state === 'none'
                      ? c.well
                      : 'transparent';
              const textColor =
                slot.state === 'all' ? c.onDone : slot.state === 'some' ? c.ink : c.inkMuted;

              return (
                <View
                  key={col}
                  style={[
                    box,
                    {
                      backgroundColor: fill,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    slot.state === 'none' && {
                      boxShadow: `inset 0px ${0.45 * u}px 0px ${c.inset}`,
                    },
                    slot.state === 'future' && {
                      borderWidth: Math.max(1, 0.3 * u),
                      borderColor: c.hairline,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 3.7 * u,
                      fontWeight: '600',
                      color: textColor,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {slot.day}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2.4 * u }}>
        <View
          style={{
            flexDirection: 'row',
            gap: 0.8 * u,
            padding: u,
            borderRadius: 50 * u,
            backgroundColor: c.well,
          }}
        >
          <View style={{ width: 2.4 * u, height: 2.4 * u, borderRadius: 1.2 * u, backgroundColor: c.ink, opacity: 0.35 }} />
          <View style={{ width: 2.4 * u, height: 2.4 * u, borderRadius: 1.2 * u, backgroundColor: c.ink, opacity: 0.35 }} />
          <View style={{ width: 2.4 * u, height: 2.4 * u, borderRadius: 1.2 * u, backgroundColor: c.done }} />
        </View>
        <Text style={{ fontSize: 4 * u, fontWeight: '700', color: c.ink }}>Day Book</Text>
      </View>
    </View>
  );
}
