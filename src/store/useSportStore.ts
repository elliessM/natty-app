import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dayKey } from './useJournalStore';

export type WorkoutType =
  | 'course'
  | 'velo'
  | 'muscu'
  | 'natation'
  | 'yoga'
  | 'football'
  | 'cardio'
  | 'autre';

export type Workout = {
  id: string;
  type: WorkoutType;
  timestamp: number;
  durationMin: number;
  kcal: number;
  note?: string;
  source: 'manual' | 'healthkit';
};

// MET (Metabolic Equivalent of Task) — kcal/kg/h. Source : Compendium 2011.
export const MET_BY_TYPE: Record<WorkoutType, number> = {
  course: 9.8,
  velo: 7.5,
  muscu: 5.0,
  natation: 8.0,
  yoga: 2.5,
  football: 7.0,
  cardio: 7.0,
  autre: 5.0,
};

export const WORKOUT_META: Record<WorkoutType, { label: string; emoji: string }> = {
  course: { label: 'Course', emoji: '🏃' },
  velo: { label: 'Vélo', emoji: '🚴' },
  muscu: { label: 'Musculation', emoji: '🏋️' },
  natation: { label: 'Natation', emoji: '🏊' },
  yoga: { label: 'Yoga', emoji: '🧘' },
  football: { label: 'Football', emoji: '⚽' },
  cardio: { label: 'Cardio', emoji: '💓' },
  autre: { label: 'Autre', emoji: '✨' },
};

export function estimateKcal(type: WorkoutType, durationMin: number, weightKg: number): number {
  const met = MET_BY_TYPE[type];
  return Math.round((met * weightKg * durationMin) / 60);
}

type SportState = {
  workouts: Workout[];
  addWorkout: (w: Omit<Workout, 'id'>) => void;
  removeWorkout: (id: string) => void;
  clear: () => void;
};

export const useSportStore = create<SportState>()(
  persist(
    (set) => ({
      workouts: [],
      addWorkout: (w) =>
        set((s) => ({
          workouts: [
            ...s.workouts,
            { ...w, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` },
          ],
        })),
      removeWorkout: (id) => set((s) => ({ workouts: s.workouts.filter((x) => x.id !== id) })),
      clear: () => set({ workouts: [] }),
    }),
    {
      name: 'natty.sport',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function workoutsForDay(workouts: Workout[], key: string): Workout[] {
  return workouts
    .filter((w) => dayKey(w.timestamp) === key)
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function dayWorkoutTotals(workouts: Workout[]) {
  return workouts.reduce(
    (acc, w) => ({ kcal: acc.kcal + w.kcal, minutes: acc.minutes + w.durationMin }),
    { kcal: 0, minutes: 0 }
  );
}
