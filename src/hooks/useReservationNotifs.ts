import { useEffect } from 'react';
import { useReservationsStore } from '../store/useReservationsStore';
import { useUserStore } from '../store/useUserStore';
import { scheduleReservationNotif, cancelReservationNotif } from '../notifications/scheduler';

/**
 * Synchronise les notifs ponctuelles avec l'état des réservations :
 *  - création → schedule (J-15min + au moment du retrait)
 *  - annulation / passé → cancel
 *  - toggle préférence "reservations" → on cancel tout / on re-schedule tout
 */
export function useReservationNotifs() {
  const reservations = useReservationsStore((s) => s.reservations);
  const enabled = useUserStore((s) => s.notificationsEnabled && s.notifPrefs.reservations);

  useEffect(() => {
    const now = Date.now();
    reservations.forEach((r) => {
      const stillUpcoming = !r.cancelledAt && !r.completedAt && r.pickupTimestamp > now - 60_000;
      if (enabled && stillUpcoming) {
        scheduleReservationNotif(r.id, r.pickupTimestamp, r.fridgeName).catch(() => {});
      } else {
        cancelReservationNotif(r.id).catch(() => {});
      }
    });
  }, [reservations, enabled]);
}
