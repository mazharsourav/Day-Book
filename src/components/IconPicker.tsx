import { ColorTokens } from "@/constants/Colors";
import { PICKER_ICONS, RITUAL_ICON_MAP } from "@/constants/ritualIcons";
import { useColors } from "@/hooks/useColors";
import { RitualIconType } from "@/types";
import * as Haptics from "expo-haptics";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

interface IconPickerProps {
  selected: RitualIconType;
  onSelect: (icon: RitualIconType) => void;
}

export function IconPicker({ selected, onSelect }: IconPickerProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const handleSelect = (icon: RitualIconType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(icon);
  };

  return (
    <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel="Icon">
      {PICKER_ICONS.map((icon) => {
        const { Icon, label } = RITUAL_ICON_MAP[icon];
        const isSelected = selected === icon;
        return (
          <Pressable
            key={icon}
            style={[styles.cell, isSelected && styles.cellSelected]}
            onPress={() => handleSelect(icon)}
            accessibilityRole="radio"
            accessibilityLabel={label}
            accessibilityState={{ selected: isSelected }}
          >
            <Icon size={24} color={c.ink} strokeWidth={2} />
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 14,
      padding: 4,
    },
    cell: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.well,
      alignItems: "center",
      justifyContent: "center",
    },
    cellSelected: {
      boxShadow: `0px 0px 0px 2px ${c.ground}, 0px 0px 0px 4px ${c.ink}`,
    },
  });
}
