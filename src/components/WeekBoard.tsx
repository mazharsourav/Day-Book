import { MovePill } from '@/components/MovePill';
import { StorageNotice } from '@/components/StorageNotice';
import { AppText } from '@/components/ui/AppText';
import { IconButton } from '@/components/ui/IconButton';
import { NewBar } from '@/components/ui/NewBar';
import { tabScreenEdges } from '@/components/ui/Panes';
import { TickCircle } from '@/components/ui/TickCircle';
import { UndoNote } from '@/components/ui/UndoNote';
import { mixHex } from '@/constants/Colors';
import { COPY, movedToLine, taskCountLine } from '@/constants/copy';
import { LAYOUT, TABLET } from '@/constants/layout';
import { MOTION } from '@/constants/motion';
import { TYPE } from '@/constants/type';
import { useTasks } from '@/context/DataContext';
import { useColors } from '@/hooks/useColors';
import { useLayoutMode } from '@/hooks/useLayoutMode';
import { useToday } from '@/hooks/useToday';
import { Task } from '@/types';
import { taskLabel } from '@/utils/a11y';
import { weekDatesFor } from '@/utils/dates';
import { selectedDayAfterRollover } from '@/utils/dayRules';
import { arrowFlips, BoardLayout, boardTarget, DropMeaning, dropMeaning, LONG_PRESS_MS, Rect } from '@/utils/dragMove';
import { useFocusRequest } from '@/utils/focusRequest';
import { haptic } from '@/utils/haptics';
import { tasksOn } from '@/utils/tasks';
import { isReadOnlyDay, shiftWeek, weekDayHeading, weekdayName, weekRangeFor } from '@/utils/weekModel';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Pencil, Plus } from 'lucide-react-native';
import { ComponentRef, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import Animated, { FadeIn, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const LETTERS = 'SMTWTFS';

type ScrollRef = Parameters<ReturnType<typeof Gesture.Pan>['blocksExternalGesture']>[0];

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

// Tablets (frames E and I): Week as a seven-day board. Every day is a column, today is tinted, past days
// are read only, and a task is pressed, held and dragged straight onto another column. The same rules
// as the phone's Week: done tasks stay put, past days refuse, holding on an arrow flips the week.
export function WeekBoard() {
  const router = useRouter();
  const c = useColors();
  const mode = useLayoutMode();
  const { tasks, toggleTask, moveTask, deleteTask, undo, showUndo, clearUndo, putBackTask } = useTasks();
  const today = useToday();

  // A day in the week being shown. Add task starts on it when it is not past.
  const [selected, setSelected] = useState(today);
  const [shownToday, setShownToday] = useState(today);
  if (shownToday !== today) {
    setShownToday(today);
    setSelected(selectedDayAfterRollover(selected, shownToday, today));
  }
  // A tapped morning note opens the week holding that day.
  const focus = useFocusRequest();
  const [seenFocus, setSeenFocus] = useState(focus?.n ?? 0);
  if (focus && focus.n !== seenFocus) {
    setSeenFocus(focus.n);
    if (focus.tab === 'week') setSelected(focus.day);
  }

  const [carrying, setCarrying] = useState<Carrying | null>(null);
  const carryingRef = useRef<Carrying | null>(null);
  const [carryWeek, setCarryWeek] = useState<string | null>(null);
  const carryWeekRef = useRef<string | null>(null);
  const arrowRef = useRef<{ weeks: 1 | -1; since: number; done: number } | null>(null);
  const layoutRef = useRef<BoardLayout | null>(null);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const gridRef = useRef<View>(null);
  const prevRef = useRef<View>(null);
  const nextRef = useRef<View>(null);
  const [notice, setNotice] = useState<{ key: number; message: string } | null>(null);

  const shownBase = carryWeek ?? selected;
  const week = weekDatesFor(shownBase);
  const onThisWeek = week[0] === weekDatesFor(today)[0];
  // While a task is carried the board keeps its place, so the task being held is never unmounted
  // (that would drop it). Between moves a new week fades in (motion table: 220 ms).
  const boardKey = carrying ? weekDatesFor(carrying.from)[0] : week[0];

  const flipWeek = (weeks: number) => {
    haptic.flip();
    setSelected(shiftWeek(selected, weeks));
  };

  const setCarry = (next: Carrying | null) => {
    carryingRef.current = next;
    setCarrying(next);
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
    carryWeekRef.current = selected;
    setCarryWeek(selected);
    Promise.all([measure(gridRef), measure(prevRef), measure(nextRef)]).then(([grid, prev, next]) => {
      if (grid && prev && next && carryingRef.current) {
        layoutRef.current = { grid, pad: TABLET.boardPad, gap: TABLET.boardGap, prev, next };
      }
    });
    return true;
  };

  const moveCarry = (x: number, y: number) => {
    const now = carryingRef.current;
    const layout = layoutRef.current;
    if (!now || !layout) return;
    const meaning = dropMeaning(boardTarget(x, y, layout), weekDatesFor(carryWeekRef.current ?? now.from), now.from, today);
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
    carryWeekRef.current = null;
    setCarryWeek(null);
    if (!now || !dropped || now.meaning?.kind !== 'move') return;
    const date = now.meaning.date;
    const result = moveTask(now.id, date);
    if (!result.ok || !result.before) return;
    haptic.drop();
    showUndo(movedToLine(date), result.before);
    setSelected(date);
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

  const handleEdit = useCallback((id: string) => router.push({ pathname: '/task', params: { id } }), [router]);
  const handleDelete = useCallback(
    (id: string) => {
      const result = deleteTask(id);
      if (result.ok && result.before) showUndo(COPY.undo.taskDeleted, result.before);
    },
    [deleteTask, showUndo]
  );
  const handleUndo = useCallback(() => {
    if (!undo) return;
    putBackTask(undo.before);
    setSelected(undo.before.task.date);
  }, [undo, putBackTask]);
  const closeNotice = useCallback(() => setNotice(null), []);
  const addOn = (date: string) => router.push({ pathname: '/task', params: { date } });

  const carried = carrying ? tasks.find((t) => t.id === carrying.id) : undefined;
  const meaning = carrying?.meaning ?? null;

  return (
    <SafeAreaView edges={tabScreenEdges(mode)} style={{ flex: 1, backgroundColor: c.ground }}>
      <StorageNotice />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          minHeight: LAYOUT.weekHeadHeight,
          paddingTop: 10,
          paddingHorizontal: LAYOUT.screenPadding,
        }}
      >
        <AppText accessibilityRole="header" style={TYPE.screenTitle}>
          {COPY.week.title}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {carrying && meaning && <MovePill meaning={meaning} />}
          <View ref={prevRef} collapsable={false}>
            <IconButton icon={ChevronLeft} label="Previous week" hot={meaning?.kind === 'arrow' && meaning.weeks === -1} onPress={() => flipWeek(-1)} />
          </View>
          <AppText
            accessibilityRole="header"
            style={{ minWidth: 132, textAlign: 'center', fontSize: 15, lineHeight: 20, fontWeight: '600', fontVariant: ['tabular-nums'] }}
          >
            {weekRangeFor(shownBase)}
          </AppText>
          <View ref={nextRef} collapsable={false}>
            <IconButton icon={ChevronRight} label="Next week" hot={meaning?.kind === 'arrow' && meaning.weeks === 1} onPress={() => flipWeek(1)} />
          </View>
          {/* Kept in place when hidden, so the arrows never jump. */}
          <Pressable
            onPress={() => {
              haptic.dayTap();
              setSelected(today);
            }}
            disabled={onThisWeek}
            accessibilityRole="button"
            accessibilityLabel="Go to today"
            accessibilityElementsHidden={onThisWeek}
            importantForAccessibility={onThisWeek ? 'no-hide-descendants' : 'auto'}
            style={{ minHeight: LAYOUT.smallButtonHeight, paddingHorizontal: 4, justifyContent: 'center', opacity: onThisWeek ? 0 : 1 }}
          >
            <AppText style={[TYPE.button, { color: c.accent }]}>{COPY.common.today}</AppText>
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        scrollEnabled={carrying === null}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: LAYOUT.newBarHeight + 8 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View key={boardKey} entering={FadeIn.duration(MOTION.weekChange)} style={{ flex: 1 }}>
          <View
            ref={gridRef}
            collapsable={false}
            style={{ flex: 1, flexDirection: 'row', gap: TABLET.boardGap, paddingTop: 14, paddingHorizontal: TABLET.boardPad }}
          >
            {week.map((date, i) => {
              // The task being carried stays in its own column while the week flips under it.
              const own = tasksOn(tasks, date);
              const list = carried && i === weekDatesFor(carried.date).indexOf(carried.date) && !own.some((t) => t.id === carried.id) ? [carried, ...own] : own;
              return (
                <BoardColumn
                  // By place, not by date, so a flip while carrying keeps the held task mounted.
                  key={i}
                  date={date}
                  letter={LETTERS[i]}
                  today={today}
                  tasks={list}
                  count={own}
                  drop={meaning?.kind === 'move' && meaning.date === date}
                  carryingId={carrying?.id ?? null}
                  onToggle={toggleTask}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAdd={addOn}
                  onStart={startCarry}
                  onMove={moveCarry}
                  onEnd={endCarry}
                  scrollRef={scrollRef as unknown as ScrollRef}
                />
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {undo && <UndoNote key={`u${undo.key}`} message={undo.message} onUndo={handleUndo} onClose={clearUndo} bottom={LAYOUT.newBarHeight + 10} />}
      {notice && !undo && <UndoNote key={`n${notice.key}`} message={notice.message} onClose={closeNotice} bottom={LAYOUT.newBarHeight + 10} />}
      <NewBar label={COPY.week.addTask} onPress={() => addOn(isReadOnlyDay(selected, today) ? today : selected)} />
    </SafeAreaView>
  );
}

interface BoardColumnProps {
  date: string;
  letter: string;
  today: string;
  // What the column shows, and what its count says (the carried task may be shown in a week it is not in).
  tasks: Task[];
  count: Task[];
  // A carried task is over this column and would move here.
  drop: boolean;
  carryingId: string | null;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (date: string) => void;
  onStart: (task: Task) => boolean;
  onMove: (x: number, y: number) => void;
  onEnd: (dropped: boolean) => void;
  scrollRef: ScrollRef;
}

// One day: its letter, its number (in a dark circle on today), how many tasks, the task cards and a + to add.
function BoardColumn({ date, letter, today, tasks, count, drop, carryingId, onToggle, onEdit, onDelete, onAdd, onStart, onMove, onEnd, scrollRef }: BoardColumnProps) {
  const c = useColors();
  const isToday = date === today;
  const past = isReadOnlyDay(date, today);
  const background = drop ? c.tint : isToday ? mixHex(c.accent, c.ground, 0.13) : mixHex(c.surface, c.ground, 0.55);
  const number = Number(date.slice(8));

  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        paddingTop: 8,
        paddingHorizontal: 5,
        paddingBottom: 10,
        borderRadius: TABLET.boardColumnRadius,
        backgroundColor: background,
        boxShadow: drop ? `inset 0px 0px 0px 2px ${c.accent}` : undefined,
      }}
    >
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel={`${weekDayHeading(date, today)}, ${number}. ${taskCountLine(count.length, count.filter((t) => t.done).length)}${past && count.length ? '. Read only.' : ''}`}
        style={{ alignItems: 'center', gap: 3, paddingBottom: 6 }}
      >
        <AppText style={[TYPE.tiny, { color: isToday ? c.text : c.muted }]}>{letter}</AppText>
        <View
          style={{
            width: TABLET.boardDay,
            height: TABLET.boardDay,
            borderRadius: TABLET.boardDay / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isToday ? c.text : 'transparent',
          }}
        >
          <AppText maxFontSizeMultiplier={1.15} style={{ fontSize: 17, lineHeight: 21, fontWeight: isToday ? '700' : '600', fontVariant: ['tabular-nums'], color: isToday ? c.ground : c.text }}>
            {number}
          </AppText>
        </View>
        <AppText style={{ fontSize: 12, lineHeight: 15, fontWeight: '500', color: c.muted }}>
          {count.length === 0 ? 'No tasks' : `${count.length} ${count.length === 1 ? 'task' : 'tasks'}`}
        </AppText>
      </View>

      {tasks.map((task) => (
        <BoardCard
          key={task.id}
          task={task}
          readOnly={past}
          lifted={carryingId === task.id}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onStart={onStart}
          onMove={onMove}
          onEnd={onEnd}
          scrollRef={scrollRef}
        />
      ))}

      {!past && (
        <Pressable
          onPress={() => onAdd(date)}
          accessibilityRole="button"
          accessibilityLabel={`${COPY.week.addTask} on ${weekdayName(date)} ${number}`}
          style={({ pressed }) => ({
            marginTop: 8,
            height: TABLET.boardAddHeight,
            borderRadius: TABLET.boardCardRadius,
            borderWidth: 1.5,
            borderStyle: isToday ? 'solid' : 'dashed',
            borderColor: isToday ? c.accent : c.ring,
            backgroundColor: c.ground,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Plus size={16} color={c.accent} strokeWidth={2.25} />
        </Pressable>
      )}
    </View>
  );
}

interface BoardCardProps {
  task: Task;
  readOnly: boolean;
  lifted: boolean;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onStart: (task: Task) => boolean;
  onMove: (x: number, y: number) => void;
  onEnd: (dropped: boolean) => void;
  scrollRef: ScrollRef;
}

// One task on the board: the circle and the pencil on top, the title under them. Pressing and holding the
// title lifts the card (it grows a little and casts a shadow) until it is dropped on a day.
function BoardCard({ task, readOnly, lifted, onToggle, onEdit, onDelete, onStart, onMove, onEnd, scrollRef }: BoardCardProps) {
  const c = useColors();
  const reduceMotion = useReducedMotion();
  const spoken = taskLabel(task.title, task.date, task.done, readOnly);

  const lift = useSharedValue(0);
  useEffect(() => {
    const to = lifted ? 1 : 0;
    lift.value = reduceMotion ? to : withTiming(to, { duration: lifted ? MOTION.moveLift : MOTION.moveSettle });
  }, [lifted, reduceMotion, lift]);
  const liftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -6 * lift.value }, { scale: 1 + 0.04 * lift.value }],
  }));

  const pan = Gesture.Pan()
    .runOnJS(true)
    .enabled(!readOnly)
    .activateAfterLongPress(LONG_PRESS_MS)
    .onStart((e) => {
      if (onStart(task)) onMove(e.absoluteX, e.absoluteY);
    })
    .onUpdate((e) => onMove(e.absoluteX, e.absoluteY))
    .onFinalize((_e, success) => onEnd(success));
  pan.blocksExternalGesture(scrollRef);

  // Screen-reader actions: dragging is never the only way to move.
  const actions = readOnly
    ? undefined
    : [
        { name: 'edit', label: COPY.common.edit },
        ...(task.done ? [] : [{ name: 'move', label: COPY.week.moveAction }]),
        { name: 'delete', label: COPY.week.deleteAction },
      ];
  const onAction = (name: string) => {
    if (name === 'edit' || name === 'move') onEdit(task.id);
    if (name === 'delete') onDelete(task.id);
  };

  return (
    <Animated.View
      style={[
        {
          marginTop: 8,
          padding: 9,
          gap: 7,
          borderRadius: TABLET.boardCardRadius,
          backgroundColor: c.ground,
          boxShadow: lifted ? `0px 14px 30px rgba(0, 0, 0, 0.22), 0px 0px 0px 1px ${c.line}` : `0px 0px 0px 1px ${c.line}`,
          opacity: readOnly ? 0.72 : 1,
          zIndex: lifted ? 3 : 0,
        },
        liftStyle,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TickCircle
          size="small"
          checked={task.done}
          name={task.title}
          locked={readOnly}
          dashed={readOnly}
          spoken={spoken}
          onPress={readOnly ? undefined : () => onToggle(task.id)}
          actions={actions}
          onAction={onAction}
        />
        {!readOnly && (
          <Pressable
            onPress={() => onEdit(task.id)}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${task.title}`}
            hitSlop={10}
            style={{ width: 28, height: 28, marginRight: -4, marginTop: -4, alignItems: 'center', justifyContent: 'center' }}
          >
            <Pencil size={15} color={c.muted} strokeWidth={2} />
          </Pressable>
        )}
      </View>
      <GestureDetector gesture={pan}>
        <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <AppText
            style={[
              { fontSize: 14, lineHeight: 18, fontWeight: '500' },
              task.done && { color: c.muted, textDecorationLine: 'line-through', textDecorationColor: c.muted },
            ]}
          >
            {task.title}
          </AppText>
        </View>
      </GestureDetector>
    </Animated.View>
  );
}
