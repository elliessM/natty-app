import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useUserStore } from '../store/useUserStore';
import {
  ensurePermission,
  ensureChannelAndroid,
  scheduleDailyReminders,
  cancelAll,
} from '../notifications/scheduler';

/**
 * Synchronise les notifications planifiées avec les préférences utilisateur.
 * Appelé au démarrage + à chaque changement des prefs.
 */
export function useNotificationsSync() {
  const enabled = useUserStore((s) => s.notificationsEnabled);
  const prefs = useUserStore((s) => s.notifPrefs);
  const weighInDay = useUserStore((s) => s.weighInDay);
  const weighInHour = useUserStore((s) => s.weighInHour);
  const askedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureChannelAndroid();

      if (!enabled) {
        await cancelAll();
        return;
      }

      // On demande la permission une seule fois — pas à chaque toggle.
      if (!askedRef.current) {
        askedRef.current = true;
        const ok = await ensurePermission();
        if (!ok) return;
      } else {
        const ok = await ensurePermission();
        if (!ok) return;
      }

      if (cancelled) return;
      await scheduleDailyReminders({
        prefs: {
          hydration: prefs.hydration,
          meals: prefs.meals,
          weighIn: prefs.weighIn,
          reservations: prefs.reservations,
        },
        weighInDay,
        weighInHour,
      });
    })().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [enabled, prefs.hydration, prefs.meals, prefs.weighIn, prefs.reservations, weighInDay, weighInHour]);

  // Relance les rappels quand l'app revient au premier plan (au cas où le
  // système les ait perdus après un long sleep).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !enabled) return;
      scheduleDailyReminders({
        prefs: {
          hydration: prefs.hydration,
          meals: prefs.meals,
          weighIn: prefs.weighIn,
          reservations: prefs.reservations,
        },
        weighInDay,
        weighInHour,
      }).catch(() => {});
    });
    return () => sub.remove();
  }, [enabled, prefs.hydration, prefs.meals, prefs.weighIn, prefs.reservations, weighInDay, weighInHour]);
}
