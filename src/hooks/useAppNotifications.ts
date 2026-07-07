import { useMemo } from 'react';
import { C } from '../tokens';
import { useUserStore, todayKey } from '../store/useUserStore';
import {
  useReservationsStore,
  upcomingReservations,
  reservationStatus,
  formatPickupTime,
} from '../store/useReservationsStore';
import { useFastingStore } from '../store/useFastingStore';

export type AppNotification = {
  id: string;
  emoji: string;
  title: string;
  body: string;
  accent: string;
  /** Cible de navigation dans le HomeStack (OrderTracking porte un id). */
  target?: { screen: 'OrderTracking'; params: { id: string } } | { screen: 'Fasting' | 'Profile' };
};

/**
 * Notifications in-app dérivées de l'état réel (réservations, hydratation,
 * pesée, jeûne) — aucune donnée factice, la cloche ne « ment » jamais :
 * badge visible seulement si cette liste est non vide.
 */
export function useAppNotifications(): AppNotification[] {
  const reservations = useReservationsStore((s) => s.reservations);
  const hydrationMl = useUserStore((s) => s.hydrationMl);
  const hydrationGoalMl = useUserStore((s) => s.hydrationGoalMl);
  const weighInDay = useUserStore((s) => s.weighInDay);
  const weightHistory = useUserStore((s) => s.weightHistory);
  const fastStartTs = useFastingStore((s) => s.startTs);

  return useMemo(() => {
    const items: AppNotification[] = [];
    const now = Date.now();

    for (const r of upcomingReservations(reservations)) {
      const st = reservationStatus(r, now);
      if (st === 'ready') {
        items.push({
          id: `resa-ready-${r.id}`,
          emoji: '🎒',
          title: 'Ta commande est prête',
          body: `À récupérer chez ${r.fridgeName} · ${formatPickupTime(r.pickupTimestamp)}`,
          accent: C.orange,
          target: { screen: 'OrderTracking', params: { id: r.id } },
        });
      } else {
        items.push({
          id: `resa-pending-${r.id}`,
          emoji: '🗓️',
          title: 'Retrait programmé',
          body: `${r.fridgeName} · ${formatPickupTime(r.pickupTimestamp)}`,
          accent: C.green,
          target: { screen: 'OrderTracking', params: { id: r.id } },
        });
      }
    }

    const hour = new Date().getHours();
    if (hour >= 9 && hydrationMl < hydrationGoalMl) {
      items.push({
        id: 'hydration',
        emoji: '💧',
        title: 'Pense à boire',
        body: `Il te reste ${Math.max(0, hydrationGoalMl - hydrationMl)} mL pour atteindre ton objectif du jour.`,
        accent: C.lime,
      });
    }

    // weighInDay : 1=Lun … 7=Dim (ISO) — getDay() : 0=Dim … 6=Sam
    const isoWeekday = ((new Date().getDay() + 6) % 7) + 1;
    const weighedToday = weightHistory.some((e) => e.date === todayKey());
    if (isoWeekday === weighInDay && !weighedToday) {
      items.push({
        id: 'weigh-in',
        emoji: '⚖️',
        title: "C'est le jour de ta pesée",
        body: 'Monte sur la balance et enregistre ton poids pour suivre ta progression.',
        accent: C.green,
        target: { screen: 'Profile' },
      });
    }

    if (fastStartTs) {
      const elapsedMin = Math.max(0, Math.floor((now - fastStartTs) / 60000));
      const h = Math.floor(elapsedMin / 60);
      const m = elapsedMin % 60;
      items.push({
        id: 'fasting',
        emoji: '⏳',
        title: 'Jeûne en cours',
        body: `${h}h${String(m).padStart(2, '0')} écoulées — tiens bon !`,
        accent: C.orange,
        target: { screen: 'Fasting' },
      });
    }

    return items;
  }, [reservations, hydrationMl, hydrationGoalMl, weighInDay, weightHistory, fastStartTs]);
}
