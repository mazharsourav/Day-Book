import { LAYOUT } from '@/constants/layout';
import { TYPE } from '@/constants/type';
import { useColors } from '@/hooks/useColors';
import { Plus } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { AppText } from './AppText';

// "New ritual" (or "Add task") at the bottom left, above the tabs: a small pine circle with a plus, and the words.
export function NewBar({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: LAYOUT.newBarHeight,
        backgroundColor: c.ground,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: LAYOUT.screenPadding,
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          minHeight: LAYOUT.smallButtonHeight,
          paddingRight: 8,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View
          style={{
            width: LAYOUT.addCircle,
            height: LAYOUT.addCircle,
            borderRadius: LAYOUT.addCircle / 2,
            backgroundColor: c.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={18} color={c.onAccent} strokeWidth={2.75} />
        </View>
        <AppText style={[TYPE.button, { color: c.accent }]}>{label}</AppText>
      </Pressable>
    </View>
  );
}
