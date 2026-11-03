import { COPY } from '@/constants/copy';
import { LAYOUT } from '@/constants/layout';
import { MOTION } from '@/constants/motion';
import { TYPE } from '@/constants/type';
import { useColors } from '@/hooks/useColors';
import { Task } from '@/types';
import { taskLabel } from '@/utils/a11y';
import { LONG_PRESS_MS } from '@/utils/dragMove';
import { Pencil } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeOut, LinearTransition, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { AppText } from './ui/AppText';
import { TickCircle } from './ui/TickCircle';

type ScrollRef = Parameters<ReturnType<typeof Gesture.Pan>['blocksExternalGesture']>[0];

// Press, hold and drag to move a task (step 10). Week does the deciding; the row only reports the finger.
export interface TaskDrag {
  // The task is being carried: it lifts with a shadow (frame 20).
  lifted: boolean;
  // Another task is being carried: this one steps back.
  faded: boolean;
  // Called once the finger has rested long enough. Returning false means the task stays put
  // (a done task: "Done tasks cannot be moved"); Week then ignores the moves that follow.
  onStart: (task: Task) => boolean;
  onMove: (x: number, y: number) => void;
  // Called when the finger lifts, or the gesture stops; `dropped` is false when it was cancelled.
  onEnd: (dropped: boolean) => void;
  // The list's scroll view (from react-native-gesture-handler), which waits until a press is clearly not a hold.
  scrollRef: ScrollRef;
}

interface TaskRowProps {
  task: Task;
  // A past day: the circle is a record (dashed when open), no pencil, and no moving.
  readOnly: boolean;
  last: boolean;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  drag?: TaskDrag;
}

// One task on Week: the circle, the title, and a pencil at the right, which is the only way to Edit task.
// Touching the title does nothing; pressing and holding it starts a move. A done title gets a line through it.
export function TaskRow({ task, readOnly, last, onToggle, onEdit, onDelete, drag }: TaskRowProps) {
  const c = useColors();
  const reduceMotion = useReducedMotion();
  const spoken = taskLabel(task.title, task.date, task.done, readOnly);
  const lifted = drag?.lifted ?? false;
  const faded = drag?.faded ?? false;

  const lift = useSharedValue(0);
  useEffect(() => {
    const to = lifted ? 1 : 0;
    lift.value = reduceMotion ? to : withTiming(to, { duration: lifted ? MOTION.moveLift : MOTION.moveSettle });
  }, [lifted, reduceMotion, lift]);
  const liftStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -4 * lift.value }] }));

  // The callbacks run on the JS thread. Week keeps track of what is being carried, so a move or an
  // end that belongs to no carried task is simply ignored there.
  const pan = Gesture.Pan()
    .runOnJS(true)
    .enabled(!readOnly && drag !== undefined)
    .activateAfterLongPress(LONG_PRESS_MS)
    .onStart((e) => {
      if (drag?.onStart(task)) drag.onMove(e.absoluteX, e.absoluteY);
    })
    .onUpdate((e) => drag?.onMove(e.absoluteX, e.absoluteY))
    .onFinalize((_e, success) => drag?.onEnd(success));
  if (drag?.scrollRef) pan.blocksExternalGesture(drag.scrollRef);

  // Screen-reader actions (board card "Reading aloud"): dragging is never the only way to move.
  // "Move to another day" opens the same Day picker as Edit.
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
    // Deleting folds the row away: it fades and the rows below close the gap (motion table: 220 ms).
    // The fold is on its own wrapper, so it never fights the row's own fading while a task is carried.
    <Animated.View exiting={FadeOut.duration(MOTION.deleteFold)} layout={reduceMotion ? undefined : LinearTransition.duration(MOTION.deleteFold)}>
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: LAYOUT.rowGap,
          minHeight: LAYOUT.rowMinHeight,
          opacity: faded ? 0.45 : 1,
        },
        lifted && {
          zIndex: 3,
          backgroundColor: c.ground,
          borderRadius: LAYOUT.noteRadius,
          marginHorizontal: -10,
          paddingHorizontal: 10,
          boxShadow: `0px 12px 28px rgba(0, 0, 0, 0.22), 0px 0px 0px 1px ${c.line}`,
        },
        liftStyle,
      ]}
    >
      <TickCircle
        checked={task.done}
        name={task.title}
        locked={readOnly}
        dashed={readOnly}
        spoken={spoken}
        onPress={readOnly ? undefined : () => onToggle(task.id)}
        actions={actions}
        onAction={onAction}
      />
      <GestureDetector gesture={pan}>
        <View style={{ flex: 1, minWidth: 0, paddingVertical: 10 }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <AppText
            style={[
              TYPE.row,
              task.done && {
                color: c.muted,
                textDecorationLine: 'line-through',
                textDecorationColor: c.muted,
              },
            ]}
          >
            {task.title}
          </AppText>
        </View>
      </GestureDetector>
      {!readOnly && (
        <Pressable
          onPress={() => onEdit(task.id)}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${task.title}`}
          style={{
            width: LAYOUT.smallButtonHeight,
            height: LAYOUT.smallButtonHeight,
            marginRight: -10,
            borderRadius: LAYOUT.smallButtonHeight / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          hitSlop={2}
        >
          <Pencil size={18} color={c.muted} strokeWidth={2} />
        </Pressable>
      )}
      {!last && !lifted && (
        <View style={{ position: 'absolute', left: LAYOUT.rowLineInset, right: 0, bottom: 0, height: 1, backgroundColor: c.line }} />
      )}
    </Animated.View>
    </Animated.View>
  );
}
