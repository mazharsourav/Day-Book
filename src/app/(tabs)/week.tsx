import { DayStrip, STRIP_SIDE_PAD } from '@/components/DayStrip';
import { MovePill } from '@/components/MovePill';
import { StorageNotice } from '@/components/StorageNotice';
import { TaskDrag, TaskRow } from '@/components/TaskRow';
import { WeekBoard } from '@/components/WeekBoard';
import { AppText } from '@/components/ui/AppText';
import { IconButton } from '@/components/ui/IconButton';
import { NewBar } from '@/components/ui/NewBar';
import { HintLine, ScreenTitle } from '@/components/ui/ScreenParts';
import { UndoNote } from '@/components/ui/UndoNote';
import { COPY, emptyDayBody, movedToLine } from '@/constants/copy';
import { LAYOUT } from '@/constants/layout';
import { TYPE } from '@/constants/type';
import { MOTION } from '@/constants/motion';
import { EASE } from '@/constants/easing';
import { useTasks } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';
import { useLayoutMode } from '@/hooks/useLayoutMode';
import { useToday } from '@/hooks/useToday';
import { Task } from '@/types';
import { weekDatesFor } from '@/utils/dates';
import { selectedDayAfterRollover } from '@/utils/dayRules';
import { arrowFlips, DragLayout, DropMeaning, dropMeaning, dropTarget, Rect } from '@/utils/dragMove';
import { useFocusRequest } from '@/utils/focusRequest';
import { haptic } from '@/utils/haptics';
import { tasksOn } from '@/utils/tasks';
import {
  isReadOnlyDay,
  shiftWeek,
  weekdayName,
  weekDayHeading,
  weekDaySubtitle,
  weekRangeFor,
  weekStrip,
} from '@/utils/weekModel';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react-native';
import { ComponentRef, ReactNode, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeInLeft, FadeInRight, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// The one-time hint "Press and hold a task to move it to another day." goes after the first move.
const HINT_KEY = 'daybook:move-hint-done';

interface Carrying {
  id: string;
  from: string;
  meaning: DropMeaning;
}

// Outside the screen, so the clock is read only when a finger moves, never while drawing.
const nowMs = () => Date.now();

const measure = (ref: RefObject<View | null>) =>
  new Promise<Rect | null>((resolve) => {
    if (!ref.current) return resolve(null);
    ref.current.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
  });

// Phones show one day at a time; tablets show the whole week as a seven-day board (frame E).
export default function WeekScreen() {
  return useLayoutMode() === 'phone' ? <WeekPhone /> : <WeekBoard />;
}

function WeekPhone() {
  const router = useRouter();
  const c = useColors();
  const { tasks, toggleTask, moveTask, deleteTask, undo, showUndo, clearUndo, putBackTask } = useTasks();
  const today = useToday();

  // The day being shown. At midnight it follows today only if it was showing today.
  const [selected, setSelected] = useState(today);
  const [shownToday, setShownToday] = useState(today);
  if (shownToday !== today) {
    setShownToday(today);
    setSelected(selectedDayAfterRollover(selected, shownToday, today));
  }
  // A tapped morning note opens Week on today's day.
  const focus = useFocusRequest();
  const [seenFocus, setSeenFocus] = useState(focus?.n ?? 0);
  if (focus && focus.n !== seenFocus) {
    setSeenFocus(focus.n);
    if (focus.tab === 'week') setSelected(focus.day);
  }

  // Moving a task (frames 20 to 24). While a task is carried, holding on an arrow flips the week the
  // strip shows (`carryWeek`), but the list stays on the day the task came from. Refs mirror the state,
  // because the gesture reports many times between renders.
  const [carrying, setCarrying] = useState<Carrying | null>(null);
  const carryingRef = useRef<Carrying | null>(null);
  const [carryWeek, setCarryWeek] = useState<string | null>(null);
  const carryWeekRef = useRef<string | null>(null);
  const arrowRef = useRef<{ weeks: 1 | -1; since: number; done: number } | null>(null);
  const layoutRef = useRef<DragLayout | null>(null);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const scrollY = useRef(0);
  const stripRef = useRef<View>(null);
  const prevRef = useRef<View>(null);
  const nextRef = useRef<View>(null);

  // A note with no Undo ("Done tasks cannot be moved").
  const [notice, setNotice] = useState<{ key: number; message: string } | null>(null);
  const [hintDone, setHintDone] = useState(true);
  useEffect(() => {
    AsyncStorage.getItem(HINT_KEY)
      .then((v) => setHintDone(v === 'done'))
      .catch(() => {});
  }, []);

  const readOnly = isReadOnlyDay(selected, today);
  const dayTasks = tasksOn(tasks, selected);
  const stripBase = carryWeek ?? selected;

  // Motion: picking a day fades the list (fast); a new week slides the strip and the list
  // in from the side it came from (medium). With Reduce Motion everything only fades.
  const reduceMotion = useReducedMotion();
  const stripWeek = weekDatesFor(stripBase)[0];
  const [lastStripWeek, setLastStripWeek] = useState(stripWeek);
  const [stripDir, setStripDir] = useState(0);
  if (lastStripWeek !== stripWeek) {
    setStripDir(stripWeek > lastStripWeek ? 1 : -1);
    setLastStripWeek(stripWeek);
  }
  const [lastDay, setLastDay] = useState(selected);
  const [dayDir, setDayDir] = useState(0);
  if (lastDay !== selected) {
    const from = weekDatesFor(lastDay)[0];
    const to = weekDatesFor(selected)[0];
    setDayDir(from === to ? 0 : to > from ? 1 : -1);
    setLastDay(selected);
  }
  const slideIn = (dir: number) =>
    reduceMotion || dir === 0
      ? FadeIn.duration(dir === 0 ? MOTION.dayListFade : MOTION.weekChange).easing(EASE)
      : (dir > 0 ? FadeInRight : FadeInLeft).duration(MOTION.weekChange).easing(EASE);

  const choose = (date: string) => {
    haptic.dayTap();
    setSelected(date);
  };
  const flipWeek = (weeks: number) => {
    haptic.flip();
    setSelected(shiftWeek(selected, weeks));
  };


  const setCarry = (next: Carrying | null) => {
    carryingRef.current = next;
    setCarrying(next);
  };
  const setStripWeek = (date: string | null) => {
    carryWeekRef.current = date;
    setCarryWeek(date);
  };

  const measureLayout = () => {
    Promise.all([measure(stripRef), measure(prevRef), measure(nextRef)]).then(([strip, prev, next]) => {
      if (strip && prev && next && carryingRef.current) layoutRef.current = { strip, stripPad: STRIP_SIDE_PAD, prev, next };
    });
  };

  const startCarry = (task: Task) => {
    if (task.done) {
      clearUndo();
      setNotice((n) => ({ key: (n?.key ?? 0) + 1, message: COPY.week.doneCannotMove }));
      return false;
    }
    haptic.pickUp();
    setNotice(null);
    setCarry({ id: task.id, from: task.date, meaning: null });
    setStripWeek(selected);
    // The days have to be in reach: a long list scrolled down goes back to the top first.
    if (scrollY.current > 0) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      setTimeout(measureLayout, 350);
    }
    measureLayout();
    return true;
  };

  const moveCarry = (x: number, y: number) => {
    const now = carryingRef.current;
    const layout = layoutRef.current;
    if (!now || !layout) return;
    const meaning = dropMeaning(dropTarget(x, y, layout), weekDatesFor(carryWeekRef.current ?? now.from), now.from, today);
    if (JSON.stringify(meaning) === JSON.stringify(now.meaning)) return;
    if (meaning && meaning.kind !== 'arrow') haptic.passDay();
    arrowRef.current = meaning?.kind === 'arrow' ? { weeks: meaning.weeks, since: nowMs(), done: 0 } : null;
    setCarry({ ...now, meaning });
  };

  const endCarry = (dropped: boolean) => {
    const now = carryingRef.current;
    arrowRef.current = null;
    layoutRef.current = null;
    setCarry(null);
    setStripWeek(null);
    if (!now || !dropped || now.meaning?.kind !== 'move') return;
    const date = now.meaning.date;
    const result = moveTask(now.id, date);
    if (!result.ok || !result.before) return;
    haptic.drop();
    showUndo(movedToLine(date), result.before);
    // The screen follows the task to its new day (frame 23).
    setSelected(date);
    if (!hintDone) {
      setHintDone(true);
      AsyncStorage.setItem(HINT_KEY, 'done').catch(() => {});
    }
  };

  // Holding on an arrow flips the week after a moment, then again while still held.
  const arrowWeeks = carrying?.meaning?.kind === 'arrow' ? carrying.meaning.weeks : 0;
  useEffect(() => {
    if (!arrowWeeks) return;
    const id = setInterval(() => {
      const arrow = arrowRef.current;
      if (!arrow || carryWeekRef.current === null) return;
      const due = arrowFlips(nowMs() - arrow.since);
      while (arrow.done < due) {
        arrow.done += 1;
        carryWeekRef.current = shiftWeek(carryWeekRef.current, arrow.weeks);
        setCarryWeek(carryWeekRef.current);
        haptic.flip();
      }
    }, 100);
    return () => clearInterval(id);
  }, [arrowWeeks]);

  const handleToggle = useCallback((id: string) => toggleTask(id), [toggleTask]);
  const handleEdit = useCallback((id: string) => router.push({ pathname: '/task', params: { id } }), [router]);
  const handleDelete = useCallback(
    (id: string) => {
      const result = deleteTask(id);
      if (result.ok && result.before) showUndo(COPY.undo.taskDeleted, result.before);
    },
    [deleteTask, showUndo]
  );
  // Undo puts the task back and shows its day, so an undone move is seen back in place.
  const handleUndo = useCallback(() => {
    if (!undo) return;
    putBackTask(undo.before);
    setSelected(undo.before.task.date);
  }, [undo, putBackTask]);
  const closeNotice = useCallback(() => setNotice(null), []);

  const rowDrag = (task: Task): TaskDrag => ({
    lifted: carrying?.id === task.id,
    faded: carrying !== null && carrying.id !== task.id,
    onStart: startCarry,
    onMove: moveCarry,
    onEnd: endCarry,
    // Gesture Handler's ScrollView ref; its types do not line up with the ref type the gesture expects.
    scrollRef: scrollRef as unknown as TaskDrag['scrollRef'],
  });

  const meaning = carrying?.meaning ?? null;
  const highlight =
    meaning?.kind === 'move' ? { date: meaning.date, kind: 'drop' as const } : meaning?.kind === 'refuse' ? { date: meaning.date, kind: 'refuse' as const } : null;
  const noteBottom = readOnly ? 16 : LAYOUT.newBarHeight + 10;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.ground }}>
      <StorageNotice />
      <ScrollView
        ref={scrollRef}
        scrollEnabled={carrying === null}
        onScroll={(e) => {
          scrollY.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: LAYOUT.newBarHeight + 12 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenTitle
          title={COPY.week.title}
          rowMinHeight={LAYOUT.weekHeadHeight}
          right={
            selected !== today ? (
              <Pressable
                onPress={() => choose(today)}
                accessibilityRole="button"
                accessibilityLabel="Go to today"
                style={{ minHeight: LAYOUT.smallButtonHeight, paddingHorizontal: 4, justifyContent: 'center' }}
              >
                <AppText style={[TYPE.button, { color: c.accent }]}>{COPY.common.today}</AppText>
              </Pressable>
            ) : undefined
          }
        />

        <WeekSwipe enabled={carrying === null} onFlip={flipWeek} scrollRef={scrollRef as unknown as TaskDrag['scrollRef']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4, paddingHorizontal: 8 }}>
          <View ref={prevRef} collapsable={false}>
            <IconButton
              icon={ChevronLeft}
              label="Previous week"
              hot={meaning?.kind === 'arrow' && meaning.weeks === -1}
              onPress={() => flipWeek(-1)}
            />
          </View>
          <AppText accessibilityRole="header" style={{ fontSize: 15, lineHeight: 20, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
            {weekRangeFor(stripBase)}
          </AppText>
          <View ref={nextRef} collapsable={false}>
            <IconButton
              icon={ChevronRight}
              label="Next week"
              hot={meaning?.kind === 'arrow' && meaning.weeks === 1}
              onPress={() => flipWeek(1)}
            />
          </View>
        </View>

        <View ref={stripRef} collapsable={false}>
          <Animated.View key={stripWeek} entering={stripDir === 0 ? undefined : slideIn(stripDir)}>
          <DayStrip
            days={weekStrip(stripBase, today, tasks).map((d) => ({ ...d, selected: d.date === selected }))}
            onSelect={choose}
            highlight={highlight}
            labelFor={(d) => {
              const day = tasksOn(tasks, d.date);
              return `${weekDayHeading(d.date, today)}, ${weekDaySubtitle(d.date, tasks)}${day.length && isReadOnlyDay(d.date, today) ? '. Read only.' : ''}`;
            }}
          />
          </Animated.View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            minHeight: 62,
            paddingTop: 10,
            paddingHorizontal: LAYOUT.screenPadding,
            paddingBottom: 2,
          }}
        >
          <View style={{ flexShrink: 1 }}>
            <AppText accessibilityRole="header" style={TYPE.dayTitle}>
              {weekDayHeading(selected, today)}
            </AppText>
            <AppText numberOfLines={1} style={{ fontSize: 14, lineHeight: 19, fontWeight: '500', color: c.muted, marginTop: 2 }}>
              {weekDaySubtitle(selected, tasks)}
            </AppText>
          </View>
          {carrying && meaning ? (
            <MovePill meaning={meaning} />
          ) : (
            readOnly && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 3 }}>
                <Lock size={14} color={c.muted} strokeWidth={2.25} />
                <AppText style={[TYPE.label, { color: c.muted }]}>{COPY.common.readOnly}</AppText>
              </View>
            )
          )}
        </View>

        <Animated.View key={selected} entering={slideIn(dayDir)} style={{ paddingTop: 2, paddingHorizontal: LAYOUT.screenPadding }}>
          {dayTasks.length === 0 ? (
            <View style={{ paddingTop: 34, gap: 4 }}>
              <AppText style={{ fontSize: 17, lineHeight: 22, fontWeight: '600' }}>{COPY.week.emptyDayTitle}</AppText>
              {!readOnly && (
                <AppText style={{ fontSize: 15, lineHeight: 21, fontWeight: '400', color: c.muted }}>
                  {emptyDayBody(weekdayName(selected))}
                </AppText>
              )}
            </View>
          ) : (
            dayTasks.map((task, i) => (
              <TaskRow
                key={task.id}
                task={task}
                readOnly={readOnly}
                last={i === dayTasks.length - 1}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
                drag={readOnly ? undefined : rowDrag(task)}
              />
            ))
          )}
        </Animated.View>
        </WeekSwipe>
        {!readOnly && dayTasks.length > 0 && carrying === null && !hintDone && <HintLine>{COPY.week.moveHint}</HintLine>}
      </ScrollView>

      {undo && (
        <UndoNote key={`u${undo.key}`} message={undo.message} onUndo={handleUndo} onClose={clearUndo} bottom={noteBottom} />
      )}
      {notice && !undo && <UndoNote key={`n${notice.key}`} message={notice.message} onClose={closeNotice} bottom={noteBottom} />}
      {!readOnly && (
        <NewBar label={COPY.week.addTask} onPress={() => router.push({ pathname: '/task', params: { date: selected } })} />
      )}
    </SafeAreaView>
  );
}

// A sideways swipe changes the week too (motion table). Not while a task is carried.
// It may run alongside the list's scroll view; vertical movement fails it, so scrolling is unaffected.
function WeekSwipe({
  enabled,
  onFlip,
  scrollRef,
  children,
}: {
  enabled: boolean;
  onFlip: (weeks: number) => void;
  scrollRef: TaskDrag['scrollRef'];
  children: ReactNode;
}) {
  const swipe = Gesture.Pan()
    .runOnJS(true)
    .enabled(enabled)
    .activeOffsetX([-25, 25])
    .failOffsetY([-12, 12])
    .simultaneousWithExternalGesture(scrollRef)
    .onEnd((e) => {
      if (e.translationX < -60) onFlip(1);
      else if (e.translationX > 60) onFlip(-1);
    });
  return (
    <GestureDetector gesture={swipe}>
      <View>{children}</View>
    </GestureDetector>
  );
}
