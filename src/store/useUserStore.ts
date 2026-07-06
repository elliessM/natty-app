import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Goal, Sex, ActivityLevel, MacroTargets } from '../types';

const HYDRATION_DEFAULT_ML = 2000;
const HYDRATION_STEP_ML = 250;
const STEPS_DEFAULT = 8000;
// Format weighInDay : 1=Lun ... 7=Dim (cohérent avec ISO et plus parlant qu'iOS weekday)
const WEIGHIN_DAY_DEFAULT = 1; // Lundi
const WEIGHIN_HOUR_DEFAULT = 8;

type UserState = {
  // Identity
  name: string;
  email: string;
  avatarColor: string;
  // Goal & restrictions (onboarding)
  goal: Goal;
  restrictions: string[];
  // Body metrics
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  // Streak / macros pct (legacy, kept for Dashboard rings compat)
  macroPct: number;
  // Onboarding flag
  hasOnboarded: boolean;
  // Hydration
  hydrationMl: number;
  hydrationDay: string;
  // Credits (placeholder)
  creditsEur: number;
  // Settings
  notificationsEnabled: boolean;
  notifPrefs: { hydration: boolean; meals: boolean; weighIn: boolean; reservations: boolean };
  unitSystem: 'metric' | 'imperial';
  language: 'fr' | 'en';
  // Weight history
  weightHistory: Array<{ date: string; kg: number }>;
  // Configurable personal goals
  hydrationGoalMl: number;
  stepsGoal: number;
  weighInDay: number; // 1=Lun ... 7=Dim
  weighInHour: number;

  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setGoal: (goal: Goal) => void;
  toggleRestriction: (id: string) => void;
  setRestrictions: (r: string[]) => void;
  setAge: (v: number) => void;
  setSex: (v: Sex) => void;
  setHeightCm: (v: number) => void;
  setWeightKg: (v: number) => void;
  setTargetWeightKg: (v: number) => void;
  setActivityLevel: (v: ActivityLevel) => void;
  setHasOnboarded: (v: boolean) => void;
  addHydration: (ml?: number) => void;
  removeHydration: (ml?: number) => void;
  resetHydrationIfNewDay: () => void;
  setNotificationsEnabled: (v: boolean) => void;
  setNotifPref: (key: 'hydration' | 'meals' | 'weighIn' | 'reservations', value: boolean) => void;
  setUnitSystem: (v: 'metric' | 'imperial') => void;
  setLanguage: (v: 'fr' | 'en') => void;
  addWeightEntry: (kg: number) => void;
  setWeightHistory: (h: Array<{ date: string; kg: number }>) => void;
  setHydrationGoalMl: (v: number) => void;
  setStepsGoal: (v: number) => void;
  setWeighInDay: (v: number) => void;
  setWeighInHour: (v: number) => void;
  reset: () => void;
};

// Clé 'YYYY-MM-DD' en date LOCALE : toISOString() donnerait la date UTC,
// et l'hydratation se réinitialiserait à 1h/2h du matin en France au lieu de minuit.
export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const initial = {
  name: 'Noé',
  email: '',
  avatarColor: '#00412f',
  goal: 'muscle' as Goal,
  restrictions: [] as string[],
  age: 28,
  sex: 'M' as Sex,
  heightCm: 178,
  weightKg: 75,
  targetWeightKg: 72,
  activityLevel: 'active' as ActivityLevel,
  macroPct: 0.78,
  hasOnboarded: false,
  hydrationMl: 0,
  hydrationDay: todayKey(),
  creditsEur: 0,
  notificationsEnabled: true,
  notifPrefs: { hydration: true, meals: true, weighIn: true, reservations: true },
  unitSystem: 'metric' as const,
  language: 'fr' as const,
  weightHistory: [] as Array<{ date: string; kg: number }>,
  hydrationGoalMl: HYDRATION_DEFAULT_ML,
  stepsGoal: STEPS_DEFAULT,
  weighInDay: WEIGHIN_DAY_DEFAULT,
  weighInHour: WEIGHIN_HOUR_DEFAULT,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initial,
      setName: (name) => set({ name: name.trim() || initial.name }),
      setEmail: (email) => set({ email: email.trim() }),
      setGoal: (goal) => set({ goal }),
      toggleRestriction: (id) =>
        set((s) => ({
          restrictions: s.restrictions.includes(id)
            ? s.restrictions.filter((x) => x !== id)
            : [...s.restrictions, id],
        })),
      setRestrictions: (restrictions) => set({ restrictions }),
      setAge: (age) => set({ age: clamp(age, 12, 100) }),
      setSex: (sex) => set({ sex }),
      setHeightCm: (heightCm) => set({ heightCm: clamp(heightCm, 120, 230) }),
      setWeightKg: (weightKg) => set({ weightKg: clamp(weightKg, 30, 200) }),
      setTargetWeightKg: (targetWeightKg) => set({ targetWeightKg: clamp(targetWeightKg, 30, 200) }),
      setActivityLevel: (activityLevel) => set({ activityLevel }),
      setHasOnboarded: (hasOnboarded) => set({ hasOnboarded }),
      addHydration: (ml = HYDRATION_STEP_ML) => {
        const day = todayKey();
        set((s) => ({
          hydrationDay: day,
          hydrationMl: (s.hydrationDay === day ? s.hydrationMl : 0) + ml,
        }));
      },
      removeHydration: (ml = HYDRATION_STEP_ML) => {
        const day = todayKey();
        set((s) => ({
          hydrationDay: day,
          hydrationMl: Math.max(0, (s.hydrationDay === day ? s.hydrationMl : 0) - ml),
        }));
      },
      resetHydrationIfNewDay: () => {
        const day = todayKey();
        if (get().hydrationDay !== day) set({ hydrationDay: day, hydrationMl: 0 });
      },
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setNotifPref: (key, value) =>
        set((s) => ({ notifPrefs: { ...s.notifPrefs, [key]: value } })),
      setUnitSystem: (unitSystem) => set({ unitSystem }),
      setLanguage: (language) => set({ language }),
      addWeightEntry: (kg) =>
        set((s) => {
          const v = clamp(Math.round(kg * 10) / 10, 30, 200);
          const today = todayKey();
          const cleaned = s.weightHistory.filter((e) => e.date !== today);
          return {
            weightHistory: [...cleaned, { date: today, kg: v }].sort((a, b) => a.date.localeCompare(b.date)),
            weightKg: v,
          };
        }),
      setWeightHistory: (weightHistory) => set({ weightHistory }),
      setHydrationGoalMl: (hydrationGoalMl) =>
        set({ hydrationGoalMl: clamp(hydrationGoalMl, 1000, 5000) }),
      setStepsGoal: (stepsGoal) => set({ stepsGoal: clamp(stepsGoal, 2000, 20000) }),
      setWeighInDay: (weighInDay) => set({ weighInDay: clamp(weighInDay, 1, 7) }),
      setWeighInHour: (weighInHour) => set({ weighInHour: clamp(weighInHour, 5, 22) }),
      reset: () => set(initial),
    }),
    {
      name: 'natty.user',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

// ─── Activity multipliers (Mifflin-St Jeor × activity) ──────────────
const ACTIVITY_MULT: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  active: 1.55,
  athlete: 1.725,
};

const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  sedentary: 'Sédentaire',
  light: 'Peu actif',
  active: 'Actif',
  athlete: 'Athlète',
};

const GOAL_LABEL: Record<Goal, string> = {
  energy: 'Énergie',
  muscle: 'Masse musculaire',
  weight: 'Perte de poids',
  perf: 'Performance',
};

/**
 * Compute daily macro targets from the user's profile.
 * BMR via Mifflin-St Jeor, TDEE via activity multiplier, adjusted by goal.
 */
export function computeMacroTargets(u: {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  goal: Goal;
}): MacroTargets {
  const bmr =
    u.sex === 'F'
      ? 10 * u.weightKg + 6.25 * u.heightCm - 5 * u.age - 161
      : 10 * u.weightKg + 6.25 * u.heightCm - 5 * u.age + 5;
  let tdee = bmr * ACTIVITY_MULT[u.activityLevel];
  if (u.goal === 'weight') tdee -= 500;
  else if (u.goal === 'muscle') tdee += 200;

  const kcal = Math.max(1200, Math.round(tdee));

  let protPct = 0.3;
  let gluPct = 0.45;
  let lipPct = 0.25;
  if (u.goal === 'weight') {
    protPct = 0.35;
    gluPct = 0.35;
    lipPct = 0.3;
  } else if (u.goal === 'perf' || u.goal === 'energy') {
    protPct = 0.25;
    gluPct = 0.5;
    lipPct = 0.25;
  }

  return {
    kcal,
    prot: Math.round((kcal * protPct) / 4),
    glu: Math.round((kcal * gluPct) / 4),
    lip: Math.round((kcal * lipPct) / 9),
  };
}

export {
  HYDRATION_DEFAULT_ML,
  HYDRATION_STEP_ML,
  STEPS_DEFAULT,
  WEIGHIN_DAY_DEFAULT,
  WEIGHIN_HOUR_DEFAULT,
  ACTIVITY_MULT,
  ACTIVITY_LABEL,
  GOAL_LABEL,
};
// Backward-compat alias — quelques écrans importent encore l'ancien nom.
export const HYDRATION_TARGET_ML = HYDRATION_DEFAULT_ML;
