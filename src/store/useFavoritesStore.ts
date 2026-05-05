import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Snapshot complet d'un favori — autonome, ne dépend pas d'OFF.
 * On stocke macros + portion pour permettre le re-log en 1 tap.
 */
export type FavoriteItem = {
  id: string; // signature stable (slug du nom)
  food: string;
  emoji: string;
  image?: string;
  // Macros pour LA portion (pas /100g)
  kcal: number;
  prot: number;
  glu: number;
  lip: number;
  /** Portion en grammes — utilisée pour info, pas obligatoire */
  grams?: number;
  addedAt: number;
};

type FavoritesState = {
  items: FavoriteItem[];
  add: (f: Omit<FavoriteItem, 'addedAt'>) => void;
  remove: (id: string) => void;
  toggle: (f: Omit<FavoriteItem, 'addedAt'>) => void;
  isFavorite: (id: string) => boolean;
  clear: () => void;
};

export function favoriteIdFromFood(food: string): string {
  return food
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (f) =>
        set((s) => {
          if (s.items.some((x) => x.id === f.id)) return s;
          return { items: [{ ...f, addedAt: Date.now() }, ...s.items] };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
      toggle: (f) =>
        set((s) => {
          const exists = s.items.find((x) => x.id === f.id);
          if (exists) return { items: s.items.filter((x) => x.id !== f.id) };
          return { items: [{ ...f, addedAt: Date.now() }, ...s.items] };
        }),
      isFavorite: (id) => get().items.some((x) => x.id === id),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'natty.favorites',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
