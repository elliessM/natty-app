import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// ─── Config ────────────────────────────────────────────────────────
// Ces valeurs sont publiques par design (clé "publishable" = safe côté client).
// La vraie sécurité vient des policies Row Level Security définies dans supabase/schema.sql.
const SUPABASE_URL = 'https://qwdznyzcszrdtcjsffld.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_CwjjGNJ6LvbtxIgNwfeSfA_bByi6jg3';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // RN : pas de redirection URL
  },
});

// ─── Types alignés avec le schéma SQL ──────────────────────────────
export type DbProfile = {
  id: string; // uuid = auth.users.id
  name: string;
  email: string | null;
  goal: 'energy' | 'muscle' | 'weight' | 'perf';
  restrictions: string[];
  age: number;
  sex: 'M' | 'F' | 'other';
  height_cm: number;
  weight_kg: number;
  target_weight_kg: number;
  activity_level: 'sedentary' | 'light' | 'active' | 'athlete';
  has_onboarded: boolean;
  // Étendu en migration 002
  weight_history: Array<{ date: string; kg: number }>;
  hydration_goal_ml: number;
  steps_goal: number;
  weigh_in_day: number;
  weigh_in_hour: number;
  notifications_enabled: boolean;
  notif_prefs: { hydration: boolean; meals: boolean; weighIn: boolean; reservations: boolean };
  unit_system: 'metric' | 'imperial';
  language: 'fr' | 'en';
  credits_eur: number;
  favorites: Array<{
    id: string;
    food: string;
    emoji: string;
    image?: string | null;
    kcal: number;
    prot: number;
    glu: number;
    lip: number;
    grams?: number | null;
    addedAt: number;
  }>;
  hydration_today: { day: string | null; ml: number };
  updated_at: string;
};

export type DbReservation = {
  id: string;
  user_id: string;
  items: any; // CartItem[] sérialisé en jsonb
  fridge_id: string;
  fridge_name: string;
  fridge_addr: string;
  pickup_ts: string;
  total: number;
  paid_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type DbJournalEntry = {
  id: string;
  user_id: string;
  source: 'scan' | 'purchase' | 'manual';
  ts: string; // ISO timestamp
  food: string;
  emoji: string;
  image: string | null;
  kcal: number;
  prot: number;
  glu: number;
  lip: number;
};
