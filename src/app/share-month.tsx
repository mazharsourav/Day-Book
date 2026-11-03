import { MonthShareCard } from '@/components/MonthShareCard';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ModalCard } from '@/components/ui/ModalCard';
import { Segmented } from '@/components/ui/Segmented';
import { darkColors, lightColors } from '@/constants/Colors';
import { COPY } from '@/constants/copy';
import { LAYOUT } from '@/constants/layout';
import { MOTION } from '@/constants/motion';
import { TYPE } from '@/constants/type';
import { useRituals } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';
import { useToday } from '@/hooks/useToday';
import { MONTH_NAMES, MonthView } from '@/utils/calendar';
import { fromDateString } from '@/utils/dates';
import { buildMonthCard, monthCardSummary } from '@/utils/monthCard';
import { shareCardImage } from '@/utils/shareImage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Share } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The card is drawn 232 wide on the board's 390 by 844 phone, and smaller when the screen is shorter.
const CARD_WIDTH = 232;
const CARD_MIN = 160;
// Height used by everything around the card on the board: status bar, title row, Look, note and button.
const AROUND_CARD = 432;

// The card is chosen from History's month, passed as ?year=2026&month=8 (month 0 is January).
export default function ShareMonthScreen() {
  const router = useRouter();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ year?: string; month?: string }>();
  const { rituals } = useRituals();
  const today = useToday();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const year = Number(params.year);
  const month = Number(params.month);
  const todayDate = fromDateString(today);
  const valid = Number.isInteger(year) && Number.isInteger(month) && month >= 0 && month <= 11;
  const view: MonthView = valid ? { year, month } : { year: todayDate.getFullYear(), month: todayDate.getMonth() };

  const model = buildMonthCard(rituals, view, today);
  const title = `${MONTH_NAMES[view.month]} ${view.year}`;
  const summary = monthCardSummary(model);

  // The card starts in the mode the app is in. The choice only changes the picture.
  const [look, setLook] = useState<'light' | 'dark'>(c.scheme);
  const reduceMotion = useReducedMotion();
  // The card fades in with an 8 point rise when the screen opens (motion table: 220 ms).
  const shown = useSharedValue(0);
  useEffect(() => {
    shown.value = withTiming(1, { duration: MOTION.shareCard, easing: Easing.out(Easing.cubic) });
  }, [shown]);
  const riseStyle = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ translateY: reduceMotion ? 0 : 8 * (1 - shown.value) }],
  }));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const cardRef = useRef<View>(null);

  const cardWidth = Math.max(
    CARD_MIN,
    Math.min(CARD_WIDTH, screenWidth - 2 * LAYOUT.screenPadding, ((screenHeight - AROUND_CARD) * 9) / 16)
  );
  const monthNumber = String(view.month + 1).padStart(2, '0');

  const handleShare = async () => {
    setMessage(null);
    setBusy(true);
    try {
      const result = await shareCardImage(cardRef, `daybook-${view.year}-${monthNumber}.png`);
      if (result === 'unavailable') setMessage(COPY.share.unavailable);
    } catch {
      setMessage(COPY.share.failed);
    } finally {
      setBusy(false);
    }
  };

  const bottom = Math.max(insets.bottom, 18) + 16;

  return (
    <ModalCard title={COPY.share.title} left={{ label: COPY.share.close, onPress: () => router.back() }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottom + LAYOUT.buttonHeight + 16 }}
      >
        <View style={{ alignItems: 'center', marginTop: 6 }}>
          {/* A hairline edge so a light card still shows on a light screen. It is not part of the picture.
              The card fades in with an 8 point rise; changing Light and Dark fades the card (220 ms). */}
          <Animated.View style={[{ borderWidth: 1, borderColor: c.line, borderRadius: 14, overflow: 'hidden' }, riseStyle]}>
            <View ref={cardRef} collapsable={false}>
              <Animated.View key={look} entering={FadeIn.duration(MOTION.shareCard)}>
                <MonthShareCard
                  model={model}
                  title={title}
                  summary={summary}
                  colors={look === 'dark' ? darkColors : lightColors}
                  width={cardWidth}
                />
              </Animated.View>
            </View>
          </Animated.View>
        </View>

        <AppText style={[TYPE.label, { color: c.muted, paddingTop: 20, paddingHorizontal: 22, paddingBottom: 8 }]}>
          {COPY.share.look}
        </AppText>
        <Segmented
          options={[
            { key: 'light', label: COPY.share.light, spoken: 'Light card' },
            { key: 'dark', label: COPY.share.dark, spoken: 'Dark card' },
          ]}
          value={look}
          onChange={setLook}
        />

        {message !== null && (
          <View
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={{ marginTop: 14, marginHorizontal: LAYOUT.screenPadding, backgroundColor: c.surface, borderRadius: 14, padding: 14 }}
          >
            <AppText style={{ fontSize: 15, lineHeight: 21, fontWeight: '400' }}>{message}</AppText>
          </View>
        )}

        <AppText style={[TYPE.small, { color: c.muted, textAlign: 'center', paddingTop: 14, paddingHorizontal: 40, lineHeight: 18 }]}>
          {COPY.share.note}
        </AppText>
      </ScrollView>

      <View style={{ position: 'absolute', left: LAYOUT.screenPadding, right: LAYOUT.screenPadding, bottom }}>
        <Button
          label={COPY.share.shareImage}
          icon={Share}
          iconStrokeWidth={2.25}
          disabled={busy}
          onPress={handleShare}
        />
      </View>
    </ModalCard>
  );
}
