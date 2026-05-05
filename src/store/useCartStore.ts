import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartItem, Product } from '../types';

type CartState = {
  items: CartItem[];
  addItem: (p: Product) => void;
  incrementItem: (id: string) => void;
  decrementItem: (id: string) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  subtotal: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (p) =>
        set((s) => {
          const ex = s.items.find((x) => x.id === p.id);
          if (ex) return { items: s.items.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x)) };
          return { items: [...s.items, { ...p, qty: 1 }] };
        }),
      incrementItem: (id) =>
        set((s) => ({ items: s.items.map((x) => (x.id === id ? { ...x, qty: x.qty + 1 } : x)) })),
      decrementItem: (id) =>
        set((s) => ({
          items: s.items.map((x) => (x.id === id ? { ...x, qty: Math.max(1, x.qty - 1) } : x)),
        })),
      removeItem: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
      clear: () => set({ items: [] }),
      subtotal: () => get().items.reduce((s, c) => s + c.price * c.qty, 0),
    }),
    {
      name: 'natty.cart',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
