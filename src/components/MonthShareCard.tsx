import { ColorTokens } from '@/constants/Colors';
import { MonthCardModel, SHARE_CARD } from '@/utils/monthCard';
import { Text, View } from 'react-native';
import { AppLogo } from './AppLogo';

interface MonthShareCardProps {
  model: MonthCardModel;
  title: string;
  summary: string;
  // The card has its own light or dark look, set on the share screen.
  colors: ColorTokens;
  // Drawn width in points. Every size scales from it, and the card is always 9:16.
  width: number;
}

// The picture that is shared: one month of dots, in the same look as History, with the app logo.
// No ritual names and no notes, by design. Text here does not grow with the phone's text size,
// because the picture must keep its layout.
export function MonthShareCard({ model, title, summary, colors: c, width }: MonthShareCardProps) {
  const u = width / 100;
  const height = (width * 16) / 9;
  const gap = SHARE_CARD.gap * u;
  const cell = (SHARE_CARD.dotsWidth * u - 6 * gap) / 7;
  const muted = c.muted;

  // Weeks of seven, Sunday first, padded with empty slots at both ends.
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
      accessibilityRole="image"
      accessibilityLabel={`${title}. ${summary}.`}
      style={{
        width,
        height,
        backgroundColor: c.ground,
        paddingHorizontal: SHARE_CARD.padX * u,
        paddingVertical: SHARE_CARD.padY * u,
        justifyContent: 'space-between',
      }}
    >
      <View>
        <Text
          numberOfLines={1}
          allowFontScaling={false}
          style={{ fontSize: SHARE_CARD.title * u, lineHeight: SHARE_CARD.title * u * 1.1, fontWeight: '700', letterSpacing: -0.02 * SHARE_CARD.title * u, color: c.text }}
        >
          {title}
        </Text>
        <Text
          numberOfLines={1}
          allowFontScaling={false}
          style={{ fontSize: SHARE_CARD.summary * u, color: muted, marginTop: SHARE_CARD.summaryGap * u, fontVariant: ['tabular-nums'] }}
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
                slot.state === 'all' ? c.accent : slot.state === 'some' ? c.tint : slot.state === 'none' ? c.surface : 'transparent';
              const textColor = slot.state === 'all' ? c.onAccent : slot.state === 'some' ? c.text : muted;

              return (
                <View
                  key={col}
                  style={[
                    box,
                    { backgroundColor: fill, alignItems: 'center', justifyContent: 'center' },
                    slot.state === 'future' && { borderWidth: Math.max(1, 0.43 * u), borderColor: c.line },
                  ]}
                >
                  <Text
                    allowFontScaling={false}
                    style={{ fontSize: SHARE_CARD.number * u, fontWeight: '600', color: textColor, fontVariant: ['tabular-nums'] }}
                  >
                    {slot.day}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SHARE_CARD.markGap * u }}>
        <AppLogo size={SHARE_CARD.logo * u} look={c.scheme} />
        <Text allowFontScaling={false} style={{ fontSize: SHARE_CARD.mark * u, fontWeight: '700', color: c.text }}>
          Day Book
        </Text>
      </View>
    </View>
  );
}
