import { LAYOUT } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { Pressable, View } from 'react-native';
import { AppText } from './AppText';

interface SegmentedProps<T extends string> {
  options: { key: T; label: string; spoken?: string }[];
  value: T;
  onChange: (key: T) => void;
  // False when the parent already has the screen's side padding.
  inset?: boolean;
}

// Two or three choices side by side in a grey track. The chosen one is a raised white pill.
// Used for Appearance in Settings and the card's Light or Dark look.
export function Segmented<T extends string>({ options, value, onChange, inset = true }: SegmentedProps<T>) {
  const c = useColors();
  return (
    <View
      accessibilityRole="radiogroup"
      style={{
        flexDirection: 'row',
        backgroundColor: c.line,
        borderRadius: 11,
        padding: 3,
        marginHorizontal: inset ? LAYOUT.screenPadding : 0,
      }}
    >
      {options.map(({ key, label, spoken }) => {
        const on = key === value;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={spoken ?? label}
            hitSlop={{ top: 5, bottom: 5 }}
            style={{
              flex: 1,
              height: 38,
              borderRadius: 9,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? c.ground : 'transparent',
              boxShadow: on ? '0px 1px 3px rgba(0, 0, 0, 0.18)' : undefined,
            }}
          >
            <AppText style={{ fontSize: 15, lineHeight: 20, fontWeight: '600', color: on ? c.text : c.muted }}>{label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
