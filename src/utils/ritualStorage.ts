import AsyncStorage from '@react-native-async-storage/async-storage';
import { createRitualStorage } from './ritualStorageCore';

export type { LoadResult, LoadStatus } from './ritualStorageCore';

const storage = createRitualStorage(AsyncStorage);

// Rituals and tasks, loaded and saved together.
export const loadData = storage.load;
export const saveData = storage.save;
