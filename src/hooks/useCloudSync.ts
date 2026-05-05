import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useUserStore } from '../store/useUserStore';
import { useJournalStore } from '../store/useJournalStore';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { useReservationsStore } from '../store/useReservationsStore';
import {
  pullProfile,
  pullJournal,
  pullReservations,
  pushProfile,
  pushJournalEntry,
  deleteJournalEntryCloud,
  pushReservation,
  deleteReservationCloud,
} from '../api/sync';

/**
 * Hook monté à la racine. Synchro hybride :
 *  - Pull initial complet à chaque login
 *  - Push profil debounced sur tout changement de champ pertinent
 *  - Mirror temps réel des entrées journal et des réservations (add / delete)
 *  - Mirror favoris via push profil (stockés en JSONB)
 */
export function useCloudSync() {
  const userId = useAuthStore((s) => s.user?.id ?? null);

  // ─── Pull initial ────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    pullProfile(userId).catch(() => {});
    pullJournal(userId).catch(() => {});
    pullReservations(userId).catch(() => {});
  }, [userId]);

  // ─── Push profil debounced ───────────────────────────────────
  const profileTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const schedulePushProfile = (uid: string) => {
    if (profileTimer.current) clearTimeout(profileTimer.current);
    profileTimer.current = setTimeout(() => {
      pushProfile(uid).catch(() => {});
    }, 800);
  };

  useEffect(() => {
    if (!userId) return;
    const unsubUser = useUserStore.subscribe((state, prev) => {
      // Comparaison shallow sur les champs synchronisés.
      const changed =
        state.name !== prev.name ||
        state.email !== prev.email ||
        state.goal !== prev.goal ||
        state.age !== prev.age ||
        state.sex !== prev.sex ||
        state.heightCm !== prev.heightCm ||
        state.weightKg !== prev.weightKg ||
        state.targetWeightKg !== prev.targetWeightKg ||
        state.activityLevel !== prev.activityLevel ||
        state.hasOnboarded !== prev.hasOnboarded ||
        state.hydrationGoalMl !== prev.hydrationGoalMl ||
        state.stepsGoal !== prev.stepsGoal ||
        state.weighInDay !== prev.weighInDay ||
        state.weighInHour !== prev.weighInHour ||
        state.notificationsEnabled !== prev.notificationsEnabled ||
        state.unitSystem !== prev.unitSystem ||
        state.language !== prev.language ||
        state.creditsEur !== prev.creditsEur ||
        state.hydrationMl !== prev.hydrationMl ||
        state.hydrationDay !== prev.hydrationDay ||
        JSON.stringify(state.restrictions) !== JSON.stringify(prev.restrictions) ||
        JSON.stringify(state.notifPrefs) !== JSON.stringify(prev.notifPrefs) ||
        JSON.stringify(state.weightHistory) !== JSON.stringify(prev.weightHistory);
      if (changed) schedulePushProfile(userId);
    });

    // Push aussi quand les favoris changent (ils vivent dans profile.favorites)
    const unsubFav = useFavoritesStore.subscribe(() => schedulePushProfile(userId));

    return () => {
      unsubUser();
      unsubFav();
      if (profileTimer.current) clearTimeout(profileTimer.current);
    };
  }, [userId]);

  // ─── Mirror journal ───────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const unsub = useJournalStore.subscribe((state, prev) => {
      const prevIds = new Set(prev.entries.map((e) => e.id));
      const currIds = new Set(state.entries.map((e) => e.id));
      state.entries.forEach((e) => {
        if (!prevIds.has(e.id)) pushJournalEntry(userId, e).catch(() => {});
      });
      prev.entries.forEach((e) => {
        if (!currIds.has(e.id)) deleteJournalEntryCloud(userId, e.id).catch(() => {});
      });
    });
    return unsub;
  }, [userId]);

  // ─── Mirror réservations ──────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const unsub = useReservationsStore.subscribe((state, prev) => {
      const prevById = new Map(prev.reservations.map((r) => [r.id, r]));
      const currById = new Map(state.reservations.map((r) => [r.id, r]));

      // Ajout / mise à jour (cancel, complete)
      state.reservations.forEach((r) => {
        const before = prevById.get(r.id);
        if (
          !before ||
          before.cancelledAt !== r.cancelledAt ||
          before.completedAt !== r.completedAt ||
          before.pickupTimestamp !== r.pickupTimestamp
        ) {
          pushReservation(userId, r).catch(() => {});
        }
      });
      // Suppression
      prev.reservations.forEach((r) => {
        if (!currById.has(r.id)) deleteReservationCloud(userId, r.id).catch(() => {});
      });
    });
    return unsub;
  }, [userId]);
}
