// Icon keys. Each one maps to a Lucide icon in src/constants/ritualIcons.ts.
// 'dot' is only a fallback for data that does not match any known icon.
export type RitualIconType =
    | 'flame' | 'leaf' | 'book' | 'flower' | 'cup' | 'moon'
    | 'dumbbell' | 'water' | 'pen' | 'music' | 'heart' | 'sun'
    | 'bed' | 'bike' | 'mind' | 'steps' | 'apple' | 'breath'
    | 'dot';

export interface Ritual {
    id: string;
    name: string;
    icon: RitualIconType;
    note: string;
    completedDates: string[] // YYYY-MM-DD
    createdAt: string // ISO date string
}

// A one-off task on exactly one day. Only a title; no notes, no repeating.
export interface Task {
    id: string;
    title: string;
    date: string // YYYY-MM-DD, the day it is planned for
    done: boolean;
    createdAt: string // ISO date string
}

// Everything Day Book keeps, saved together so a save is never half done.
export interface AppData {
    rituals: Ritual[];
    tasks: Task[];
}
