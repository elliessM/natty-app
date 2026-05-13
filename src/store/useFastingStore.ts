import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FastingPreset = '16:8' | '18:6' | '20:4' | 'custom';

export const PRESETS: Record<Exclude<FastingPreset, 'custom'>, { fastH: number; eatH: number }> = {
  '16:8': { fastH: 16, eatH: 8 },
  '18:6': { fastH: 18, eatH: 6 },
  '20:4': { fastH: 20, eatH: 4 },
};

export type FastSession = {
  id: string;
  startTs: number;
  endTs: number;
  targetFastH: number;
  completed: boolean; // true si endTs - startTs >= targetFastH
};

type FastingState = {
  preset: FastingPreset;
  customFastH: number; // utilisé si preset === 'custom'
  startTs: number | null; // null = pas de jeûne en cours
  notifyStart: boolean; // notif au démarrage de la fenêtre alim suivante
  notifyEnd: boolean; // notif quand l'objectif est atteint
  history: FastSession[];

  setPreset: (p: FastingPreset) => void;
  setCustomFastH: (h: number) => void;
  startFast: () => void;
  stopFast: () => void;
  setNotifyStart: (v: boolean) => void;
  setNotifyEnd: (v: boolean) => void;
  clearHistory: () => void;
};

export const useFastingStore = create<FastingState>()(
  persist(
    (set, get) => ({
      preset: '16:8',
      customFastH: 14,
      startTs: null,
      notifyStart: true,
      notifyEnd: true,
      history: [],

      setPreset: (preset) => set({ preset }),
      setCustomFastH: (h) => set({ customFastH: Math.max(8, Math.min(24, Math.round(h))) }),
      startFast: () => set({ startTs: Date.now() }),
      stopFast: () => {
        const { startTs, history } = get();
        if (!startTs) return;
        const targetFastH = currentTargetFastH(get());
        const endTs = Date.now();
        const elapsedH = (endTs - startTs) / 3_600_000;
        const session: FastSession = {
          id: `${endTs}-${Math.random().toString(36).slice(2, 8)}`,
          startTs,
          endTs,
          targetFastH,
          completed: elapsedH >= targetFastH,
        };
        set({ startTs: null, history: [...history, session].slice(-30) });
      },
      setNotifyStart: (v) => set({ notifyStart: v }),
      setNotifyEnd: (v) => set({ notifyEnd: v }),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'natty.fasting',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function currentTargetFastH(state: Pick<FastingState, 'preset' | 'customFastH'>): number {
  if (state.preset === 'custom') return state.customFastH;
  return PRESETS[state.preset].fastH;
}

export function currentEatH(state: Pick<FastingState, 'preset' | 'customFastH'>): number {
  if (state.preset === 'custom') return Math.max(0, 24 - state.customFastH);
  return PRESETS[state.preset].eatH;
}

export function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
