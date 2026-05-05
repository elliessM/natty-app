import { useEffect, useState } from 'react';
import { Pedometer } from 'expo-sensors';
import { useUserStore } from '../store/useUserStore';

type StepsState = {
  steps: number;
  available: boolean;
  goal: number;
};

/**
 * Retourne le nombre de pas du jour.
 * - iOS : CoreMotion via HealthKit (autorisation demandée au premier usage)
 * - Android : capteur pas-de-marche
 * - Fallback : 0 si indispo (simulateur, watchOS only, etc.)
 */
export function useSteps(): StepsState {
  const [steps, setSteps] = useState(0);
  const [available, setAvailable] = useState(false);
  const goal = useUserStore((s) => s.stepsGoal);

  useEffect(() => {
    let cancelled = false;
    let subscription: { remove: () => void } | null = null;

    (async () => {
      try {
        const ok = await Pedometer.isAvailableAsync();
        if (cancelled) return;
        setAvailable(ok);
        if (!ok) return;

        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();

        const result = await Pedometer.getStepCountAsync(start, end);
        if (cancelled) return;
        setSteps(result.steps ?? 0);

        // Écoute les pas en live pour incrémenter au fil de la journée.
        subscription = Pedometer.watchStepCount(({ steps: delta }) => {
          setSteps((s) => s + delta);
        });
      } catch {
        if (!cancelled) setAvailable(false);
      }
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  return { steps, available, goal };
}

// Conservé en backward-compat — pointe vers le défaut, les écrans préfèrent
// la valeur dynamique du store via useSteps().goal
export { STEPS_DEFAULT as STEPS_GOAL } from '../store/useUserStore';
