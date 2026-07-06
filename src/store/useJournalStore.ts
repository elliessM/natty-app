import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uuidv4, isUuid } from '../shared/uuid';

export type JournalSource = 'scan' | 'purchase' | 'manual';

export type JournalEntry = {
  id: string;
  source: JournalSource;
  timestamp: number;
  food: string;
  emoji: string;
  image?: string;
  kcal: number;
  prot: number;
  glu: number;
  lip: number;
};

type JournalState = {
  entries: JournalEntry[];
  addEntry: (entry: Omit<JournalEntry, 'id'>) => void;
  removeEntry: (id: string) => void;
  clear: () => void;
};

export const useJournalStore = create<JournalState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (e) =>
        set((s) => ({
          entries: [...s.entries, { ...e, id: uuidv4() }],
        })),
      removeEntry: (id) => set((s) => ({ entries: s.entries.filter((x) => x.id !== id) })),
      clear: () => set({ entries: [] }),
    }),
    {
      name: 'natty.journal',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      // v0 → v1 : les ids locaux `${Date.now()}-random` sont rejetés par la colonne uuid de Supabase
      migrate: (persisted: any) => {
        if (Array.isArray(persisted?.entries)) {
          persisted.entries = persisted.entries.map((e: any) =>
            isUuid(e.id) ? e : { ...e, id: uuidv4() }
          );
        }
        return persisted;
      },
    }
  )
);

// ─── Helpers ─────────────────────────────────────────────────────────
export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function entriesForDay(entries: JournalEntry[], key: string): JournalEntry[] {
  return entries.filter((e) => dayKey(e.timestamp) === key).sort((a, b) => a.timestamp - b.timestamp);
}

export function dayTotals(entries: JournalEntry[]) {
  return entries.reduce(
    (acc, e) => ({
      kcal: acc.kcal + e.kcal,
      prot: acc.prot + e.prot,
      glu: acc.glu + e.glu,
      lip: acc.lip + e.lip,
    }),
    { kcal: 0, prot: 0, glu: 0, lip: 0 }
  );
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Parse une clé 'YYYY-MM-DD' en date **locale** (new Date(key) l'interpréterait en UTC). */
export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDayLabel(key: string): string {
  const d = parseDayKey(key);
  const today = dayKey(Date.now());
  const yest = dayKey(Date.now() - 86400000);
  if (key === today) return "Aujourd'hui";
  if (key === yest) return 'Hier';
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}
