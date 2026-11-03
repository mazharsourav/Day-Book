import { hitSlopFor, LAYOUT, TOUCH } from '@/constants/layout';
import { PICKER_ICONS, RITUAL_ICON_MAP } from '@/constants/ritualIcons';
import { useColors } from '@/hooks/useColors';
import { RitualIconType } from '@/types';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

interface IconPickerProps {
  selected: RitualIconType;
  onSelect: (icon: RitualIconType) => void;
  // Tablets keep six to a row in the form's narrower icon column (frame J); the touch area still reaches 48.
  alwaysSix?: boolean;
}

// Six grey circles to a row, or five on a narrow phone so each one stays big enough to press.
// Sizes are rounded down so a row never spills over, and each row is centred.
function gridFor(width: number, alwaysSix: boolean) {
  const fit = (columns: number) => Math.floor((width - LAYOUT.iconGap * (columns - 1)) / columns);
  const columns = alwaysSix || fit(LAYOUT.iconColumns) >= TOUCH ? LAYOUT.iconColumns : LAYOUT.iconColumns - 1;
  return { columns, cell: fit(columns) };
}

// The chosen icon turns pine with a pine ring around it.
export function IconPicker({ selected, onSelect, alwaysSix = false }: IconPickerProps) {
  const c = useColors();
  const [width, setWidth] = useState(0);
  const { columns, cell } = gridFor(width, alwaysSix);

  const rows: RitualIconType[][] = [];
  for (let i = 0; i < PICKER_ICONS.length; i += columns) rows.push(PICKER_ICONS.slice(i, i + columns));

  // Not on the board's haptics list, so picking an icon is quiet.
  const handleSelect = (icon: RitualIconType) => onSelect(icon);

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="radiogroup"
      accessibilityLabel="Icon"
      style={{ gap: LAYOUT.iconGap }}
    >
      {width > 0 &&
        rows.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row', justifyContent: 'center', gap: LAYOUT.iconGap }}>
            {row.map((icon) => {
              const { Icon, label } = RITUAL_ICON_MAP[icon];
              const on = selected === icon;
              return (
                <Pressable
                  key={icon}
                  onPress={() => handleSelect(icon)}
                  accessibilityRole="radio"
                  accessibilityLabel={label}
                  accessibilityState={{ selected: on }}
                  hitSlop={hitSlopFor(cell)}
                  style={{
                    width: cell,
                    height: cell,
                    borderRadius: cell / 2,
                    backgroundColor: c.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: on ? `0px 0px 0px 2px ${c.ground}, 0px 0px 0px 4px ${c.accent}` : undefined,
                  }}
                >
                  <Icon size={22} color={on ? c.accent : c.text} strokeWidth={1.9} />
                </Pressable>
              );
            })}
          </View>
        ))}
    </View>
  );
}
