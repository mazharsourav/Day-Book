import { AppText } from '@/components/ui/AppText';
import { LAYOUT } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { WheelValue, wheelColumns } from '@/utils/timeFormat';
import { useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from 'react-native';

const ROW = LAYOUT.wheelRow;
const HEIGHT = ROW * LAYOUT.wheelRows;
const PAD = (HEIGHT - ROW) / 2;
const two = (n: number) => String(n).padStart(2, '0');

// Hours and minutes wrap around, as drawn (59 sits above 00). The list is repeated this many times
// and starts in the middle copy: two full turns each way, kept small so a phone draws few rows.
const LOOP_COPIES = 5;

// One scrolling column. The middle row is the choice; rows fade with distance, as drawn.
// A screen reader treats it as one adjustable control (swipe up or down to change).
function WheelColumn({
  items,
  index,
  onIndex,
  label,
  loop = false,
}: {
  items: string[];
  index: number;
  onIndex: (i: number) => void;
  label: string;
  loop?: boolean;
}) {
  const c = useColors();
  const ref = useRef<ScrollView>(null);
  const rows = loop ? Array.from({ length: LOOP_COPIES }, () => items).flat() : items;
  const start = loop ? Math.floor(LOOP_COPIES / 2) * items.length + index : index;
  // The row in the middle, counted in `rows`.
  const [shown, setShown] = useState(start);

  const scrollTo = (row: number, animated: boolean) => ref.current?.scrollTo({ y: row * ROW, animated });

  // Start on the saved choice once the column is laid out.
  const placed = useRef(false);
  const onLayout = () => {
    if (placed.current) return;
    placed.current = true;
    scrollTo(start, false);
  };

  const show = (row: number) => {
    setShown(row);
    onIndex(row % items.length);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const row = Math.max(0, Math.min(rows.length - 1, Math.round(e.nativeEvent.contentOffset.y / ROW)));
    if (row !== shown) show(row);
  };

  const step = (by: number) => {
    const row = Math.max(0, Math.min(rows.length - 1, shown + by));
    show(row);
    scrollTo(row, false);
  };

  return (
    <View
      style={{ flex: 1, height: HEIGHT }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: rows[shown] }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
    >
      <ScrollView
        ref={ref}
        onLayout={onLayout}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToInterval={ROW}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={{ paddingVertical: PAD }}
      >
        {rows.map((item, i) => {
          const away = Math.abs(i - shown);
          return (
            <View key={i} style={{ height: ROW, alignItems: 'center', justifyContent: 'center' }}>
              <AppText
                maxFontSizeMultiplier={1}
                style={{
                  fontSize: 22,
                  fontWeight: away === 0 ? '700' : '500',
                  fontVariant: ['tabular-nums'],
                  color: c.text,
                  opacity: away === 0 ? 1 : away === 1 ? 0.55 : 0.28,
                }}
              >
                {item}
              </AppText>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

interface TimeWheelProps {
  value: WheelValue;
  uses24: boolean;
  // Only the column that moved; the parent merges it into the value.
  onChange: (change: Partial<WheelValue>) => void;
}

// The scrolling time wheel from frame 36: hours, every minute, and AM/PM on a 12 hour phone.
export function TimeWheel({ value, uses24, onChange }: TimeWheelProps) {
  const c = useColors();
  const { hours, minutes, periods } = wheelColumns(uses24);

  return (
    <View style={{ flexDirection: 'row', gap: 6, height: HEIGHT, marginTop: 16, marginBottom: 4 }}>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, top: PAD, height: ROW, backgroundColor: c.surface, borderRadius: LAYOUT.wheelBandRadius }}
      />
      <WheelColumn
        label="Hour"
        loop
        items={hours.map((h) => (uses24 ? two(h) : String(h)))}
        index={Math.max(0, hours.indexOf(value.hour))}
        onIndex={(i) => onChange({ hour: hours[i] })}
      />
      <WheelColumn
        label="Minute"
        loop
        items={minutes.map(two)}
        index={Math.max(0, minutes.indexOf(value.minute))}
        onIndex={(i) => onChange({ minute: minutes[i] })}
      />
      {periods && (
        <WheelColumn
          label="AM or PM"
          items={['AM', 'PM']}
          index={value.pm ? 1 : 0}
          onIndex={(i) => onChange({ pm: i === 1 })}
        />
      )}
    </View>
  );
}
