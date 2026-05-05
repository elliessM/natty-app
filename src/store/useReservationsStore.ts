import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartItem } from '../types';

export type ReservationStatus = 'pending' | 'ready' | 'past' | 'cancelled';

export type Reservation = {
  id: string;
  items: CartItem[];
  fridgeId: string;
  fridgeName: string;
  fridgeAddr: string;
  pickupTimestamp: number;
  total: number;
  createdAt: number;
  cancelledAt?: number;
  completedAt?: number;
};

type ReservationsState = {
  reservations: Reservation[];
  createReservation: (r: Omit<Reservation, 'id' | 'createdAt'>) => string;
  cancelReservation: (id: string) => void;
  completeReservation: (id: string) => void;
  clearAll: () => void;
};

export const useReservationsStore = create<ReservationsState>()(
  persist(
    (set) => ({
      reservations: [],
      createReservation: (r) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        set((s) => ({
          reservations: [...s.reservations, { ...r, id, createdAt: Date.now() }],
        }));
        return id;
      },
      cancelReservation: (id) =>
        set((s) => ({
          reservations: s.reservations.map((r) => (r.id === id ? { ...r, cancelledAt: Date.now() } : r)),
        })),
      completeReservation: (id) =>
        set((s) => ({
          reservations: s.reservations.map((r) => (r.id === id ? { ...r, completedAt: Date.now() } : r)),
        })),
      clearAll: () => set({ reservations: [] }),
    }),
    {
      name: 'natty.reservations',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ─── Helpers ────────────────────────────────────────────────────────

/** Ready window : 15 min avant → 30 min après l'heure de retrait. */
const READY_BEFORE_MS = 15 * 60 * 1000;
const READY_AFTER_MS = 30 * 60 * 1000;

export function reservationStatus(r: Reservation, now = Date.now()): ReservationStatus {
  if (r.cancelledAt) return 'cancelled';
  if (r.completedAt) return 'past';
  if (now >= r.pickupTimestamp - READY_BEFORE_MS && now <= r.pickupTimestamp + READY_AFTER_MS) return 'ready';
  if (now > r.pickupTimestamp + READY_AFTER_MS) return 'past';
  return 'pending';
}

export function upcomingReservations(list: Reservation[]): Reservation[] {
  const now = Date.now();
  return list
    .filter((r) => {
      const s = reservationStatus(r, now);
      return s === 'pending' || s === 'ready';
    })
    .sort((a, b) => a.pickupTimestamp - b.pickupTimestamp);
}

export function pastReservations(list: Reservation[]): Reservation[] {
  const now = Date.now();
  return list
    .filter((r) => {
      const s = reservationStatus(r, now);
      return s === 'past' || s === 'cancelled';
    })
    .sort((a, b) => b.pickupTimestamp - a.pickupTimestamp);
}

export function formatPickupTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isSameDay = d.toDateString() === now.toDateString();
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (isSameDay) return `Aujourd'hui · ${time}`;
  if (isTomorrow) return `Demain · ${time}`;
  const months = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  return `${d.getDate()} ${months[d.getMonth()]} · ${time}`;
}

export function countdownLabel(ts: number, now = Date.now()): string {
  const diff = ts - now;
  if (diff <= 0) return 'Maintenant';
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `dans ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `dans ${hours}h`;
  const days = Math.round(hours / 24);
  return `dans ${days}j`;
}
