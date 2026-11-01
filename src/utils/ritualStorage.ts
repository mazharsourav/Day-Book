import AsyncStorage from '@react-native-async-storage/async-storage';
import { createRitualStorage } from './ritualStorageCore';

export type { LoadResult, LoadStatus } from './ritualStorageCore';

const storage = createRitualStorage(AsyncStorage);

export const loadRituals = storage.load;
export const saveRituals = storage.save;
