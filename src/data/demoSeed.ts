import { useUserStore } from '../store/useUserStore';
import { useJournalStore, type JournalEntry } from '../store/useJournalStore';
import { useReservationsStore } from '../store/useReservationsStore';
import { useCartStore } from '../store/useCartStore';
import { PRODUCTS } from './products';

/**
 * Seed démo — remplit profil, journal, hydratation et réservations avec un set
 * cohérent réaliste, étalé sur 7 jours. Idempotent : on efface avant de pousser.
 */

type SeedMeal = {
  food: string;
  emoji: string;
  kcal: number;
  prot: number;
  glu: number;
  lip: number;
  source: 'scan' | 'purchase' | 'manual';
  // Décalage par rapport à minuit du jour, en minutes (8h05 = 485)
  minutes: number;
};

const TEMPLATE: SeedMeal[][] = [
  // Aujourd'hui (J-0)
  [
    { food: 'Bowl avoine, banane & amandes', emoji: '🥣', kcal: 380, prot: 14, glu: 56, lip: 11, source: 'manual', minutes: 8 * 60 + 15 },
    { food: 'Chicken Bowl · 1 unité', emoji: '🍗', kcal: 420, prot: 38, glu: 48, lip: 12, source: 'purchase', minutes: 13 * 60 + 5 },
    { food: 'Yaourt grec · 150 g', emoji: '🥛', kcal: 145, prot: 16, glu: 8, lip: 5, source: 'manual', minutes: 16 * 60 + 30 },
  ],
  // Hier (J-1)
  [
    { food: 'Œufs brouillés · 2 unités', emoji: '🍳', kcal: 220, prot: 14, glu: 2, lip: 16, source: 'manual', minutes: 8 * 60 + 45 },
    { food: 'Salade César au poulet', emoji: '🥗', kcal: 450, prot: 30, glu: 22, lip: 26, source: 'scan', minutes: 12 * 60 + 50 },
    { food: 'Protein Shake · 1 unité', emoji: '🥤', kcal: 280, prot: 25, glu: 15, lip: 4, source: 'purchase', minutes: 18 * 60 + 10 },
    { food: 'Saumon, quinoa & brocoli', emoji: '🐟', kcal: 540, prot: 36, glu: 42, lip: 22, source: 'manual', minutes: 20 * 60 + 5 },
  ],
  // J-2
  [
    { food: 'Tartine avocat & œuf', emoji: '🥑', kcal: 360, prot: 16, glu: 28, lip: 22, source: 'manual', minutes: 9 * 60 + 0 },
    { food: 'Veggie Wrap · 1 unité', emoji: '🥗', kcal: 340, prot: 18, glu: 32, lip: 10, source: 'purchase', minutes: 13 * 60 + 20 },
    { food: 'Energy Bar · 1 unité', emoji: '🍫', kcal: 190, prot: 12, glu: 22, lip: 6, source: 'purchase', minutes: 16 * 60 + 0 },
  ],
  // J-3
  [
    { food: 'Smoothie banane épinards', emoji: '🥤', kcal: 240, prot: 8, glu: 42, lip: 5, source: 'manual', minutes: 8 * 60 + 30 },
    { food: 'Pâtes bolognaise', emoji: '🍝', kcal: 580, prot: 28, glu: 78, lip: 16, source: 'scan', minutes: 13 * 60 + 0 },
    { food: 'Pomme & beurre de cacahuète', emoji: '🍎', kcal: 220, prot: 6, glu: 28, lip: 11, source: 'manual', minutes: 16 * 60 + 45 },
  ],
  // J-4
  [
    { food: 'Granola maison & lait', emoji: '🥣', kcal: 410, prot: 12, glu: 58, lip: 14, source: 'manual', minutes: 8 * 60 + 10 },
    { food: 'Curry de pois chiches', emoji: '🍛', kcal: 480, prot: 18, glu: 64, lip: 16, source: 'scan', minutes: 12 * 60 + 40 },
  ],
  // J-5
  [
    { food: 'Œufs brouillés · 3 unités', emoji: '🍳', kcal: 330, prot: 21, glu: 3, lip: 24, source: 'manual', minutes: 9 * 60 + 15 },
    { food: 'Burger maison + salade', emoji: '🍔', kcal: 720, prot: 36, glu: 58, lip: 38, source: 'scan', minutes: 13 * 60 + 30 },
    { food: 'Eau pétillante & citron', emoji: '💧', kcal: 5, prot: 0, glu: 1, lip: 0, source: 'manual', minutes: 17 * 60 + 0 },
  ],
  // J-6
  [
    { food: 'Pancakes protéinés', emoji: '🥞', kcal: 420, prot: 28, glu: 52, lip: 9, source: 'manual', minutes: 9 * 60 + 30 },
    { food: 'Chicken Bowl · 1 unité', emoji: '🍗', kcal: 420, prot: 38, glu: 48, lip: 12, source: 'purchase', minutes: 13 * 60 + 0 },
    { food: 'Energy Bar · 1 unité', emoji: '🍫', kcal: 190, prot: 12, glu: 22, lip: 6, source: 'purchase', minutes: 17 * 60 + 30 },
  ],
];

function startOfDay(offsetDays = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - offsetDays);
  return d;
}

function buildJournalEntries(): JournalEntry[] {
  const entries: JournalEntry[] = [];
  TEMPLATE.forEach((day, dayOffset) => {
    const base = startOfDay(dayOffset).getTime();
    day.forEach((m) => {
      entries.push({
        id: `demo-${dayOffset}-${m.minutes}-${Math.random().toString(36).slice(2, 6)}`,
        source: m.source,
        timestamp: base + m.minutes * 60_000,
        food: m.food,
        emoji: m.emoji,
        kcal: m.kcal,
        prot: m.prot,
        glu: m.glu,
        lip: m.lip,
      });
    });
  });
  return entries;
}

function buildReservations() {
  const tomorrow = startOfDay(-1);
  tomorrow.setHours(12, 30, 0, 0);
  const yest = startOfDay(2);
  yest.setHours(19, 0, 0, 0);

  return [
    {
      id: `demo-resa-upcoming-${Date.now()}`,
      items: [
        { ...PRODUCTS[0], qty: 1 },
        { ...PRODUCTS[1], qty: 2 },
      ],
      fridgeId: 'fcnation',
      fridgeName: 'Fitness Club Nation',
      fridgeAddr: '12 Rue de la Santé',
      pickupTimestamp: tomorrow.getTime(),
      total: PRODUCTS[0].price + PRODUCTS[1].price * 2,
      createdAt: Date.now() - 3600_000,
      paymentTiming: 'now' as const,
      paidAt: Date.now() - 3600_000,
    },
    {
      id: `demo-resa-past-${Date.now()}`,
      items: [{ ...PRODUCTS[2], qty: 1 }],
      fridgeId: 'fcnation',
      fridgeName: 'Fitness Club Nation',
      fridgeAddr: '12 Rue de la Santé',
      pickupTimestamp: yest.getTime(),
      total: PRODUCTS[2].price,
      createdAt: yest.getTime() - 7200_000,
      completedAt: yest.getTime() + 600_000,
      paymentTiming: 'now' as const,
      paidAt: yest.getTime() - 7200_000,
    },
  ];
}

const DEMO_NAME = 'Noé';

function buildWeightHistory(): Array<{ date: string; kg: number }> {
  // 7 mesures sur 35j, descente régulière 76.4 → 75.0 (objectif 72)
  const points = [
    { offset: 35, kg: 76.4 },
    { offset: 28, kg: 76.0 },
    { offset: 21, kg: 75.7 },
    { offset: 14, kg: 75.4 },
    { offset: 7, kg: 75.2 },
    { offset: 3, kg: 75.1 },
    { offset: 0, kg: 75.0 },
  ];
  return points.map((p) => {
    const d = startOfDay(p.offset);
    return { date: d.toISOString().slice(0, 10), kg: p.kg };
  });
}

export function seedDemoData() {
  // 1. Profil
  useUserStore.setState({
    name: DEMO_NAME,
    email: 'noe@natty.app',
    goal: 'muscle',
    restrictions: ['lactose'],
    age: 28,
    sex: 'M',
    heightCm: 178,
    weightKg: 75,
    targetWeightKg: 72,
    activityLevel: 'active',
    macroPct: 0.78,
    hasOnboarded: true,
    hydrationMl: 1500,
    hydrationDay: new Date().toISOString().slice(0, 10),
    creditsEur: 12.5,
    notificationsEnabled: true,
    weightHistory: buildWeightHistory(),
  });

  // 2. Journal
  useJournalStore.setState({ entries: buildJournalEntries() });

  // 3. Réservations
  useReservationsStore.setState({ reservations: buildReservations() });

  // 4. Panier vide (la démo doit pouvoir relancer un parcours d'achat propre)
  useCartStore.setState({ items: [] });
}

export function clearDemoData() {
  useJournalStore.setState({ entries: [] });
  useReservationsStore.setState({ reservations: [] });
  useCartStore.setState({ items: [] });
  useUserStore.setState({ hydrationMl: 0 });
}
