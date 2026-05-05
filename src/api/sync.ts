import { supabase, type DbProfile, type DbJournalEntry, type DbReservation } from './supabase';
import { useUserStore } from '../store/useUserStore';
import { useJournalStore, type JournalEntry } from '../store/useJournalStore';
import { useFavoritesStore, type FavoriteItem } from '../store/useFavoritesStore';
import { useReservationsStore, type Reservation } from '../store/useReservationsStore';
import type { CartItem } from '../types';

// ─── Profile ──────────────────────────────────────────────────────

export async function pullProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) {
    console.warn('[sync] pullProfile', error.message);
    return;
  }
  if (!data) return;
  const p = data as DbProfile;

  useUserStore.setState({
    name: p.name,
    email: p.email ?? '',
    goal: p.goal,
    restrictions: p.restrictions ?? [],
    age: p.age,
    sex: p.sex,
    heightCm: p.height_cm,
    weightKg: p.weight_kg,
    targetWeightKg: p.target_weight_kg,
    activityLevel: p.activity_level,
    hasOnboarded: !!p.has_onboarded,
    weightHistory: Array.isArray(p.weight_history) ? p.weight_history : [],
    hydrationGoalMl: p.hydration_goal_ml ?? 2000,
    stepsGoal: p.steps_goal ?? 8000,
    weighInDay: p.weigh_in_day ?? 1,
    weighInHour: p.weigh_in_hour ?? 8,
    notificationsEnabled: !!p.notifications_enabled,
    notifPrefs: p.notif_prefs ?? { hydration: true, meals: true, weighIn: true, reservations: true },
    unitSystem: p.unit_system ?? 'metric',
    language: p.language ?? 'fr',
    creditsEur: Number(p.credits_eur ?? 0),
    hydrationMl: p.hydration_today?.ml ?? 0,
    hydrationDay: p.hydration_today?.day ?? new Date().toISOString().slice(0, 10),
  });

  // Favoris : remplace localement
  if (Array.isArray(p.favorites)) {
    useFavoritesStore.setState({
      items: p.favorites.map((f) => ({
        id: f.id,
        food: f.food,
        emoji: f.emoji,
        image: f.image ?? undefined,
        kcal: Number(f.kcal),
        prot: Number(f.prot),
        glu: Number(f.glu),
        lip: Number(f.lip),
        grams: f.grams ?? undefined,
        addedAt: Number(f.addedAt) || Date.now(),
      })) as FavoriteItem[],
    });
  }
}

export async function pushProfile(userId: string) {
  const s = useUserStore.getState();
  const fav = useFavoritesStore.getState().items;

  const payload: Partial<DbProfile> = {
    id: userId,
    name: s.name,
    email: s.email || null,
    goal: s.goal,
    restrictions: s.restrictions,
    age: s.age,
    sex: s.sex,
    height_cm: s.heightCm,
    weight_kg: s.weightKg,
    target_weight_kg: s.targetWeightKg,
    activity_level: s.activityLevel,
    has_onboarded: s.hasOnboarded,
    weight_history: s.weightHistory,
    hydration_goal_ml: s.hydrationGoalMl,
    steps_goal: s.stepsGoal,
    weigh_in_day: s.weighInDay,
    weigh_in_hour: s.weighInHour,
    notifications_enabled: s.notificationsEnabled,
    notif_prefs: s.notifPrefs,
    unit_system: s.unitSystem,
    language: s.language,
    credits_eur: s.creditsEur,
    favorites: fav as any,
    hydration_today: { day: s.hydrationDay, ml: s.hydrationMl },
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  if (error) console.warn('[sync] pushProfile', error.message);
}

// ─── Journal ──────────────────────────────────────────────────────

export async function pullJournal(userId: string) {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('ts', { ascending: true });
  if (error) {
    console.warn('[sync] pullJournal', error.message);
    return;
  }
  const rows = (data ?? []) as DbJournalEntry[];
  const entries: JournalEntry[] = rows.map((r) => ({
    id: r.id,
    source: r.source,
    timestamp: new Date(r.ts).getTime(),
    food: r.food,
    emoji: r.emoji,
    image: r.image ?? undefined,
    kcal: Number(r.kcal),
    prot: Number(r.prot),
    glu: Number(r.glu),
    lip: Number(r.lip),
  }));
  useJournalStore.setState({ entries });
}

export async function pushJournalEntry(userId: string, e: JournalEntry) {
  const { error } = await supabase.from('journal_entries').upsert({
    id: e.id,
    user_id: userId,
    source: e.source,
    ts: new Date(e.timestamp).toISOString(),
    food: e.food,
    emoji: e.emoji,
    image: e.image ?? null,
    kcal: e.kcal,
    prot: e.prot,
    glu: e.glu,
    lip: e.lip,
  });
  if (error) console.warn('[sync] pushJournalEntry', error.message);
}

export async function deleteJournalEntryCloud(userId: string, entryId: string) {
  const { error } = await supabase.from('journal_entries').delete().eq('user_id', userId).eq('id', entryId);
  if (error) console.warn('[sync] deleteJournalEntryCloud', error.message);
}

// ─── Reservations ─────────────────────────────────────────────────

function dbResaToLocal(r: DbReservation): Reservation {
  return {
    id: r.id,
    items: (r.items ?? []) as CartItem[],
    fridgeId: r.fridge_id,
    fridgeName: r.fridge_name,
    fridgeAddr: r.fridge_addr,
    pickupTimestamp: new Date(r.pickup_ts).getTime(),
    total: Number(r.total),
    createdAt: new Date(r.created_at).getTime(),
    cancelledAt: r.cancelled_at ? new Date(r.cancelled_at).getTime() : undefined,
    completedAt: r.completed_at ? new Date(r.completed_at).getTime() : undefined,
  };
}

export async function pullReservations(userId: string) {
  const { data, error } = await supabase.from('reservations').select('*').eq('user_id', userId);
  if (error) {
    console.warn('[sync] pullReservations', error.message);
    return;
  }
  const rows = (data ?? []) as DbReservation[];
  useReservationsStore.setState({ reservations: rows.map(dbResaToLocal) });
}

export async function pushReservation(userId: string, r: Reservation) {
  const { error } = await supabase.from('reservations').upsert({
    id: r.id,
    user_id: userId,
    items: r.items as any,
    fridge_id: r.fridgeId,
    fridge_name: r.fridgeName,
    fridge_addr: r.fridgeAddr,
    pickup_ts: new Date(r.pickupTimestamp).toISOString(),
    total: r.total,
    cancelled_at: r.cancelledAt ? new Date(r.cancelledAt).toISOString() : null,
    completed_at: r.completedAt ? new Date(r.completedAt).toISOString() : null,
    created_at: new Date(r.createdAt).toISOString(),
  });
  if (error) console.warn('[sync] pushReservation', error.message);
}

export async function deleteReservationCloud(userId: string, id: string) {
  const { error } = await supabase.from('reservations').delete().eq('user_id', userId).eq('id', id);
  if (error) console.warn('[sync] deleteReservationCloud', error.message);
}
