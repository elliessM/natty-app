import type { Goal } from '../types';
import { C } from '../tokens';
import type { JournalEntry } from '../store/useJournalStore';
import { dayKey, entriesForDay, dayTotals } from '../store/useJournalStore';

export type Challenge = {
  id: string;
  title: string;
  emoji: string;
  color: string;
  reward: string;
  rewardPts: number;
  current: number;
  target: number;
  scope: 'global' | 'personal';
};

type Ctx = {
  goal: Goal;
  targets: { kcal: number; prot: number; glu: number; lip: number };
  journal: JournalEntry[];
  hydrationMl: number;
  hydrationGoalMl: number;
  stepsToday: number;
};

const COLORS = {
  orange: C.orange,
  lime: C.lime,
  green: C.green,
  beige: C.beige,
  berry: '#c94f5e', // pas d'équivalent dans la palette
};

/**
 * Retourne N défis (2 globaux + 3 personnalisés selon l'objectif).
 * La progression est calculée live à partir du journal, de l'hydratation et des pas.
 */
export function generateChallenges(ctx: Ctx): Challenge[] {
  const { goal, targets, journal, hydrationMl, hydrationGoalMl, stepsToday } = ctx;

  // ─── Mesures dérivées sur 7 jours ─────────────────────────────
  const today = dayKey(Date.now());
  const weekKeys = Array.from({ length: 7 }, (_, i) => dayKey(Date.now() - i * 86400000));

  const scansThisWeek = journal.filter(
    (e) => e.source === 'scan' && weekKeys.includes(dayKey(e.timestamp))
  ).length;

  const daysWithEntry = new Set(journal.map((e) => dayKey(e.timestamp)));
  const streakDays = (() => {
    let s = 0;
    for (let i = 0; i < 30; i++) {
      const k = dayKey(Date.now() - i * 86400000);
      if (daysWithEntry.has(k)) s++;
      else break;
    }
    return s;
  })();

  const todayTotals = dayTotals(entriesForDay(journal, today));

  // ─── Global challenges (identiques pour tous) ─────────────────
  const global: Challenge[] = [
    {
      id: 'global-scans-5',
      title: 'Scanner 5 repas cette semaine',
      emoji: '📷',
      color: COLORS.orange,
      reward: '+50 pts',
      rewardPts: 50,
      current: Math.min(scansThisWeek, 5),
      target: 5,
      scope: 'global',
    },
    {
      id: 'global-streak-7',
      title: '7 jours de streak',
      emoji: '🔥',
      color: COLORS.lime,
      reward: '+100 pts',
      rewardPts: 100,
      current: Math.min(streakDays, 7),
      target: 7,
      scope: 'global',
    },
  ];

  // ─── Personal challenges (selon goal) ─────────────────────────
  const personal: Challenge[] = [];

  if (goal === 'muscle') {
    personal.push({
      id: 'muscle-prot-today',
      title: `Atteindre ${targets.prot}g de protéines aujourd'hui`,
      emoji: '💪',
      color: COLORS.lime,
      reward: '+30 pts',
      rewardPts: 30,
      current: Math.min(Math.round(todayTotals.prot), targets.prot),
      target: targets.prot,
      scope: 'personal',
    });
    personal.push({
      id: 'muscle-kcal-surplus',
      title: 'Remplir ton plan calorique',
      emoji: '🍽️',
      color: COLORS.orange,
      reward: '+40 pts',
      rewardPts: 40,
      current: Math.min(Math.round(todayTotals.kcal), targets.kcal),
      target: targets.kcal,
      scope: 'personal',
    });
  } else if (goal === 'weight') {
    // On compte combien de jours cette semaine sont restés sous 85% du TDEE.
    const deficitDays = weekKeys.filter((k) => {
      const t = dayTotals(entriesForDay(journal, k));
      return t.kcal > 0 && t.kcal <= targets.kcal * 0.85;
    }).length;
    personal.push({
      id: 'weight-deficit-4',
      title: 'Rester en déficit 4 jours cette semaine',
      emoji: '🔥',
      color: COLORS.orange,
      reward: '+80 pts',
      rewardPts: 80,
      current: Math.min(deficitDays, 4),
      target: 4,
      scope: 'personal',
    });
    personal.push({
      id: 'weight-prot-keep',
      title: `Tenir ${targets.prot}g de protéines aujourd'hui`,
      emoji: '🥩',
      color: COLORS.lime,
      reward: '+30 pts',
      rewardPts: 30,
      current: Math.min(Math.round(todayTotals.prot), targets.prot),
      target: targets.prot,
      scope: 'personal',
    });
  } else if (goal === 'energy') {
    personal.push({
      id: 'energy-hydration-5',
      title: `Atteindre ${(hydrationGoalMl / 1000).toLocaleString('fr-FR')}L d'eau 5 jours d'affilée`,
      emoji: '💧',
      color: COLORS.lime,
      reward: '+60 pts',
      rewardPts: 60,
      // Pas d'historique hydratation sur 7 jours (stocké qu'en courant) → estimation.
      current: hydrationMl >= hydrationGoalMl ? 1 : 0,
      target: 5,
      scope: 'personal',
    });
    personal.push({
      id: 'energy-carbs',
      title: `Atteindre ${targets.glu}g de glucides aujourd'hui`,
      emoji: '🌾',
      color: COLORS.orange,
      reward: '+30 pts',
      rewardPts: 30,
      current: Math.min(Math.round(todayTotals.glu), targets.glu),
      target: targets.glu,
      scope: 'personal',
    });
  } else {
    // perf
    personal.push({
      id: 'perf-scans-posttraining',
      title: '3 scans post-training cette semaine',
      emoji: '🏃',
      color: COLORS.orange,
      reward: '+50 pts',
      rewardPts: 50,
      current: Math.min(scansThisWeek, 3),
      target: 3,
      scope: 'personal',
    });
    personal.push({
      id: 'perf-steps-today',
      title: '10 000 pas aujourd\'hui',
      emoji: '👟',
      color: COLORS.green,
      reward: '+40 pts',
      rewardPts: 40,
      current: Math.min(stepsToday, 10000),
      target: 10000,
      scope: 'personal',
    });
  }

  // Défi commun à tous objectifs : inviter un ami (toujours dispo).
  personal.push({
    id: 'invite-friend',
    title: 'Inviter un ami à rejoindre Natty',
    emoji: '💚',
    color: COLORS.green,
    reward: '+200 pts',
    rewardPts: 200,
    current: 0,
    target: 1,
    scope: 'personal',
  });

  return [...global, ...personal];
}

export function computePoints(challenges: Challenge[]): number {
  return challenges
    .filter((c) => c.current >= c.target)
    .reduce((sum, c) => sum + c.rewardPts, 0);
}
