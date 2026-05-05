import { create } from 'zustand';
import type { ScanResult } from '../types';

export type ScanCandidate = ScanResult & { confidence: number; emoji: string };

type ScanState = {
  candidates: ScanCandidate[];
  selected: ScanCandidate | null;
  setCandidates: (c: ScanCandidate[]) => void;
  selectCandidate: (c: ScanCandidate) => void;
  clear: () => void;
  // Backward compat
  lastResult: ScanResult | null;
  setResult: (r: ScanResult | null) => void;
};

export const useScanStore = create<ScanState>((set) => ({
  candidates: [],
  selected: null,
  setCandidates: (candidates) => set({ candidates, selected: candidates[0] ?? null, lastResult: candidates[0] ?? null }),
  selectCandidate: (selected) => set({ selected, lastResult: selected }),
  clear: () => set({ candidates: [], selected: null, lastResult: null }),
  lastResult: null,
  setResult: (lastResult) => set({ lastResult }),
}));

/**
 * Mock IA — 3 propositions plausibles à partir d'un même cliché.
 * En attendant Claude Vision : on tire au hasard parmi un pool.
 */
const MOCK_POOL: ScanCandidate[] = [
  { food: 'Poulet grillé + Riz basmati', kcal: 520, prot: 42, glu: 58, lip: 12, confidence: 0.94, emoji: '🍗' },
  { food: 'Bowl de quinoa, avocat & saumon', kcal: 610, prot: 34, glu: 52, lip: 26, confidence: 0.89, emoji: '🐟' },
  { food: 'Wrap poulet crudités', kcal: 480, prot: 32, glu: 48, lip: 18, confidence: 0.86, emoji: '🌯' },
  { food: 'Salade César au poulet', kcal: 450, prot: 30, glu: 22, lip: 26, confidence: 0.91, emoji: '🥗' },
  { food: 'Pâtes bolognaise', kcal: 580, prot: 28, glu: 78, lip: 16, confidence: 0.93, emoji: '🍝' },
  { food: 'Burger maison + frites', kcal: 820, prot: 38, glu: 62, lip: 42, confidence: 0.96, emoji: '🍔' },
  { food: 'Omelette aux légumes', kcal: 340, prot: 22, glu: 12, lip: 22, confidence: 0.88, emoji: '🍳' },
  { food: 'Pizza margherita', kcal: 720, prot: 28, glu: 88, lip: 28, confidence: 0.95, emoji: '🍕' },
  { food: 'Curry de pois chiches', kcal: 480, prot: 18, glu: 64, lip: 16, confidence: 0.84, emoji: '🍛' },
];

export function generateMockCandidates(): ScanCandidate[] {
  const pool = [...MOCK_POOL].sort(() => Math.random() - 0.5);
  const main = pool[0];
  const alts = pool.slice(1, 3).map((c) => ({ ...c, confidence: c.confidence - 0.1 - Math.random() * 0.1 }));
  return [main, ...alts];
}
