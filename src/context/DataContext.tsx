import { useToday } from '@/hooks/useToday';
import { AppData, Ritual, Task } from '@/types';
import { LoadStatus, loadData, saveData } from '@/utils/ritualStorage';
import { createSaver } from '@/utils/saver';
import * as TaskRules from '@/utils/tasks';
import type { Placed, TaskRefusal } from '@/utils/tasks';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';

// What the person should be told about their saved data, if anything.
export type StorageNoticeKind = 'save-failed' | 'newer' | 'read-failed' | 'unreadable';

// The note with an Undo button after a task is deleted (and, from step 10, moved). It lives here because
// Delete task is pressed in the form, and the note shows on Week after the form closes.
export interface PendingUndo {
  // A new number for each note, so a new note replaces the old one and restarts its time.
  key: number;
  message: string;
  before: Placed;
}

// A task change either works, giving where the task was (for Undo), or says why it was refused.
export type TaskChange = { ok: true; before: Placed | null } | { ok: false; reason: TaskRefusal };

interface DataContextValue {
  rituals: Ritual[];
  addRitual: (ritual: Ritual) => void;
  updateRitual: (id: string, changes: Partial<Pick<Ritual, 'name' | 'icon' | 'note'>>) => void;
  toggleCompleted: (id: string, date: string) => void;
  deleteRitual: (id: string) => void;

  tasks: Task[];
  addTask: (title: string, date: string) => TaskChange;
  editTask: (id: string, changes: { title?: string; date?: string }) => TaskChange;
  toggleTask: (id: string) => TaskChange;
  moveTask: (id: string, date: string) => TaskChange;
  deleteTask: (id: string) => TaskChange;
  // Undo for a move or a delete.
  putBackTask: (before: Placed) => void;
  undo: PendingUndo | null;
  showUndo: (message: string, before: Placed) => void;
  clearUndo: () => void;

  // Replaces everything, used when a backup is restored.
  replaceAll: (data: AppData) => void;
  // False when the saved data could not be read, so changes would not be kept.
  canSave: boolean;
  storageNotice: StorageNoticeKind | null;
  retrySave: () => void;
  dismissNotice: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

const EMPTY: AppData = { rituals: [], tasks: [] };

// Holds rituals and tasks together and saves them in one write, so a save is never half done.
export function DataProvider({ children }: { children: ReactNode }) {
  // A fresh install starts empty.
  const [data, setData] = useState<AppData>(EMPTY);
  const [loadStatus, setLoadStatus] = useState<LoadStatus | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [unreadableSeen, setUnreadableSeen] = useState(false);
  const [saver] = useState(() => createSaver(saveData, (ok) => setSaveFailed(!ok)));
  const today = useToday();
  const [undo, setUndo] = useState<PendingUndo | null>(null);

  const isLoaded = loadStatus !== null;
  const canSave = loadStatus === 'ok' || loadStatus === 'unreadable';

  // Load saved data once.
  useEffect(() => {
    let cancelled = false;
    loadData().then((result) => {
      if (cancelled) return;
      setData({ rituals: result.rituals, tasks: result.tasks });
      setLoadStatus(result.status);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Save whenever anything changes (but never before the first load, and never over data we could not read).
  useEffect(() => {
    if (!isLoaded || !canSave) return;
    saver.schedule(data, 0);
  }, [data, isLoaded, canSave, saver]);

  // Make sure nothing is still waiting when the app goes to the background or closes.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') void saver.flush();
    });
    return () => {
      sub.remove();
      void saver.flush();
    };
  }, [saver]);

  const setRituals = useCallback((change: (rituals: Ritual[]) => Ritual[]) => {
    setData((prev) => ({ ...prev, rituals: change(prev.rituals) }));
  }, []);

  const addRitual = useCallback((ritual: Ritual) => setRituals((prev) => [...prev, ritual]), [setRituals]);

  const updateRitual = useCallback(
    (id: string, changes: Partial<Pick<Ritual, 'name' | 'icon' | 'note'>>) =>
      setRituals((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r))),
    [setRituals]
  );

  const toggleCompleted = useCallback(
    (id: string, date: string) =>
      setRituals((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const done = r.completedDates.includes(date);
          return {
            ...r,
            completedDates: done ? r.completedDates.filter((d) => d !== date) : [date, ...r.completedDates],
          };
        })
      ),
    [setRituals]
  );

  const deleteRitual = useCallback((id: string) => setRituals((prev) => prev.filter((r) => r.id !== id)), [setRituals]);

  // Task changes are worked out on the current list first, so the screen hears at once whether
  // it worked, then stored. The rules live in utils/tasks.ts.
  const applyTasks = useCallback(
    (result: TaskRules.TaskResult | TaskRules.AddResult): TaskChange => {
      if (!result.ok) return result;
      setData((prev) => ({ ...prev, tasks: result.tasks }));
      return { ok: true, before: 'before' in result ? result.before : null };
    },
    []
  );

  const addTask = useCallback(
    (title: string, date: string) =>
      applyTasks(
        TaskRules.addTask(
          data.tasks,
          { id: `t${Date.now()}${Math.floor(Math.random() * 1000)}`, title, date, createdAt: new Date().toISOString() },
          today
        )
      ),
    [applyTasks, data.tasks, today]
  );
  const editTask = useCallback(
    (id: string, changes: { title?: string; date?: string }) => applyTasks(TaskRules.editTask(data.tasks, id, changes, today)),
    [applyTasks, data.tasks, today]
  );
  const toggleTask = useCallback(
    (id: string) => applyTasks(TaskRules.toggleTask(data.tasks, id, today)),
    [applyTasks, data.tasks, today]
  );
  const moveTask = useCallback(
    (id: string, date: string) => applyTasks(TaskRules.moveTask(data.tasks, id, date, today)),
    [applyTasks, data.tasks, today]
  );
  const deleteTask = useCallback(
    (id: string) => applyTasks(TaskRules.deleteTask(data.tasks, id, today)),
    [applyTasks, data.tasks, today]
  );
  const putBackTask = useCallback((before: Placed) => {
    setData((prev) => ({ ...prev, tasks: TaskRules.putBack(prev.tasks, before.task, before.index) }));
  }, []);

  const showUndo = useCallback(
    (message: string, before: Placed) => setUndo((prev) => ({ key: (prev?.key ?? 0) + 1, message, before })),
    []
  );
  const clearUndo = useCallback(() => setUndo(null), []);

  const replaceAll = useCallback((next: AppData) => setData(next), []);

  const retrySave = useCallback(() => {
    void saver.retry();
  }, [saver]);

  const dismissNotice = useCallback(() => setUnreadableSeen(true), []);

  if (!isLoaded) return null;

  let storageNotice: StorageNoticeKind | null = null;
  if (loadStatus === 'newer') storageNotice = 'newer';
  else if (loadStatus === 'read-failed') storageNotice = 'read-failed';
  else if (saveFailed) storageNotice = 'save-failed';
  else if (loadStatus === 'unreadable' && !unreadableSeen) storageNotice = 'unreadable';

  return (
    <DataContext.Provider
      value={{
        rituals: data.rituals,
        addRitual,
        updateRitual,
        toggleCompleted,
        deleteRitual,
        tasks: data.tasks,
        addTask,
        editTask,
        toggleTask,
        moveTask,
        deleteTask,
        putBackTask,
        undo,
        showUndo,
        clearUndo,
        replaceAll,
        canSave,
        storageNotice,
        retrySave,
        dismissNotice,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useRituals and useTasks must be used within DataProvider');
  return ctx;
}

// Rituals, and everything about saved data.
export const useRituals = useData;

// The Week list.
export function useTasks() {
  const { tasks, addTask, editTask, toggleTask, moveTask, deleteTask, putBackTask, undo, showUndo, clearUndo } = useData();
  return { tasks, addTask, editTask, toggleTask, moveTask, deleteTask, putBackTask, undo, showUndo, clearUndo };
}
