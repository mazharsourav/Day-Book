import { Ritual } from '@/types';
import { LoadStatus, loadRituals, saveRituals } from '@/utils/ritualStorage';
import { createSaver } from '@/utils/saver';
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import { AppState } from 'react-native';

// What the person should be told about their saved data, if anything.
export type StorageNoticeKind = 'save-failed' | 'newer' | 'read-failed' | 'unreadable';

interface RitualsContextValue {
    rituals: Ritual[];
    addRitual: (ritual: Ritual) => void;
    updateRitual: (id: string, changes: Partial<Pick<Ritual, 'name' | 'icon' | 'note'>>) => void;
    toggleCompleted: (id: string, date: string) => void;
    deleteRitual: (id: string) => void;
    // Replaces everything, used when a backup is restored.
    replaceAll: (rituals: Ritual[]) => void;
    // False when the saved data could not be read, so changes would not be kept.
    canSave: boolean;
    storageNotice: StorageNoticeKind | null;
    retrySave: () => void;
    dismissNotice: () => void;
}

const RitualsContext = createContext<RitualsContextValue | null>(null);

export function RitualsProvider({ children }: { children: ReactNode }) {
    // A fresh install starts empty.
    const [rituals, setRituals] = useState<Ritual[]>([]);
    const [loadStatus, setLoadStatus] = useState<LoadStatus | null>(null);
    const [saveFailed, setSaveFailed] = useState(false);
    const [unreadableSeen, setUnreadableSeen] = useState(false);
    const [saver] = useState(() => createSaver(saveRituals, (ok) => setSaveFailed(!ok)));

    const isLoaded = loadStatus !== null;
    const canSave = loadStatus === 'ok' || loadStatus === 'unreadable';

    // Load saved rituals once.
    useEffect(() => {
        let cancelled = false;
        loadRituals().then((result) => {
            if (cancelled) return;
            setRituals(result.rituals);
            setLoadStatus(result.status);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    // Save whenever the list changes (but never before the first load, and never over data we could not read).
    useEffect(() => {
        if (!isLoaded || !canSave) return;
        saver.schedule(rituals, 0);
    }, [rituals, isLoaded, canSave, saver]);

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

    const addRitual = useCallback((ritual: Ritual) => {
        setRituals((prev) => [...prev, ritual]);
    }, []);

    const updateRitual = useCallback(
        (id: string, changes: Partial<Pick<Ritual, 'name' | 'icon' | 'note'>>) => {
            setRituals((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)));
        },
        []
    );

    const toggleCompleted = useCallback((id: string, date: string) => {
        setRituals((prev) =>
            prev.map((r) => {
                if (r.id !== id) return r;
                const done = r.completedDates.includes(date);
                return {
                    ...r,
                    completedDates: done
                        ? r.completedDates.filter((d) => d !== date)
                        : [date, ...r.completedDates],
                };
            })
        );
    }, []);

    const deleteRitual = useCallback((id: string) => {
        setRituals((prev) => prev.filter((r) => r.id !== id));
    }, []);

    const replaceAll = useCallback((next: Ritual[]) => {
        setRituals(next);
    }, []);

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
        <RitualsContext.Provider
            value={{
                rituals,
                addRitual,
                updateRitual,
                toggleCompleted,
                deleteRitual,
                replaceAll,
                canSave,
                storageNotice,
                retrySave,
                dismissNotice,
            }}
        >
            {children}
        </RitualsContext.Provider>
    );
}

export function useRituals(): RitualsContextValue {
  const ctx = useContext(RitualsContext);
  if (!ctx) throw new Error("useRituals must be used within RitualsProvider");
  return ctx;
}
