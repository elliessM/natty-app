import type { Goal } from '../types';
import type { JournalEntry } from '../store/useJournalStore';
import { dayKey, entriesForDay, dayTotals } from '../store/useJournalStore';

export type CoachAction = {
  label: string;
  type: 'hydrate' | 'scan' | 'addFood' | 'reservations' | 'stats' | 'map' | 'social';
};

export type CoachTip = {
  id: string;
  emoji: string;
  /** Court (max ~6 mots), affiché en gros */
  headline: string;
  /** Détail (1-2 phrases) */
  body: string;
  /** Couleur d'accent (sera appliquée au liseré gauche / pill) */
  tone: 'orange' | 'lime' | 'green' | 'beige';
  actions: CoachAction[];
  /** Score de priorité — plus élevé = plus urgent */
  priority: number;
};

type Ctx = {
  goal: Goal;
  targets: { kcal: number; prot: number; glu: number; lip: number };
  journal: JournalEntry[];
  hydrationMl: number;
  hydrationGoalMl: number;
  stepsToday: number;
  stepsGoal: number;
  hasUpcomingReservation: boolean;
  daysWithEntryStreak: number;
  hour: number;
};

/**
 * Règles déterministes — pas d'IA réelle, mais un set de tips contextuels qui
 * suffit pour donner l'illusion d'un coach attentif. Plus tard : on pourra
 * appeler Claude API depuis une Edge Function.
 */
export function generateCoachTip(ctx: Ctx): CoachTip {
  const { journal, hydrationMl, hydrationGoalMl, targets, stepsToday, stepsGoal, hour } = ctx;
  const todayKeyStr = dayKey(Date.now());
  const todayEntries = entriesForDay(journal, todayKeyStr);
  const t = dayTotals(todayEntries);
  const protRatio = targets.prot > 0 ? t.prot / targets.prot : 0;
  const kcalRatio = targets.kcal > 0 ? t.kcal / targets.kcal : 0;
  const hydratRatio = hydrationGoalMl > 0 ? hydrationMl / hydrationGoalMl : 0;

  const tips: CoachTip[] = [];

  // ─── Réveil — pas encore mangé / bu ce matin ────────────────────
  if (hour >= 7 && hour < 11 && todayEntries.length === 0) {
    tips.push({
      id: 'morning-empty',
      emoji: '☀️',
      headline: 'Bonjour, on attaque la journée ?',
      body: 'Ajoute ton petit-déjeuner pour démarrer le tracking — tu poseras les bases de tes macros du jour.',
      tone: 'orange',
      actions: [{ label: 'Ajouter un repas', type: 'addFood' }],
      priority: 70,
    });
  }

  // ─── Pas d'hydratation depuis le réveil ────────────────────────
  if (hour >= 9 && hydrationMl === 0) {
    tips.push({
      id: 'hydrate-zero',
      emoji: '💧',
      headline: "Tu n'as pas encore bu aujourd'hui",
      body: `Commence par 250 mL d'eau — la meilleure habitude post-réveil.`,
      tone: 'lime',
      actions: [{ label: '+ 250 mL', type: 'hydrate' }],
      priority: 85,
    });
  } else if (hour >= 14 && hydratRatio < 0.4) {
    tips.push({
      id: 'hydrate-low',
      emoji: '💧',
      headline: `Tu es à ${Math.round(hydratRatio * 100)}% de ton hydratation`,
      body: `Il te reste ${Math.max(0, hydrationGoalMl - hydrationMl)} mL pour atteindre ton objectif. Pause eau ?`,
      tone: 'lime',
      actions: [{ label: '+ 250 mL', type: 'hydrate' }],
      priority: 65,
    });
  }

  // ─── Manque de protéines en fin de journée ─────────────────────
  if (hour >= 13 && hour < 22 && protRatio < 0.6 && t.kcal > 0) {
    const missing = Math.round(targets.prot - t.prot);
    tips.push({
      id: 'low-prot',
      emoji: '💪',
      headline: `${missing}g de protéines à rattraper`,
      body:
        ctx.goal === 'muscle' || ctx.goal === 'perf'
          ? `Important pour ton objectif ${ctx.goal === 'muscle' ? 'masse' : 'perf'}. Un Protein Shake ou un Chicken Bowl te sauve.`
          : `Bonne dose le soir = bonne récup demain. Un yaourt grec ou des œufs feront l'affaire.`,
      tone: 'orange',
      actions: [
        { label: 'Ajouter un repas', type: 'addFood' },
        { label: 'Voir les frigos', type: 'map' },
      ],
      priority: 75,
    });
  }

  // ─── Surplus calorique ─────────────────────────────────────────
  if (kcalRatio >= 1.1 && hour >= 17) {
    tips.push({
      id: 'kcal-surplus',
      emoji: '⚠️',
      headline: `+${Math.round(t.kcal - targets.kcal)} kcal sur ton objectif`,
      body: 'Pas de panique — une marche de 30 min ou une séance équilibre la balance énergétique.',
      tone: 'beige',
      actions: [{ label: 'Voir mes stats', type: 'stats' }],
      priority: 60,
    });
  }

  // ─── Bonne journée — encouragement ─────────────────────────────
  if (hour >= 19 && kcalRatio >= 0.8 && kcalRatio <= 1.05 && protRatio >= 0.85) {
    tips.push({
      id: 'great-day',
      emoji: '🎯',
      headline: 'Journée parfaite !',
      body: `${Math.round(t.kcal)} kcal et ${Math.round(t.prot)}g de protéines : pile dans tes objectifs. Bravo.`,
      tone: 'green',
      actions: [{ label: 'Voir mes stats', type: 'stats' }],
      priority: 50,
    });
  }

  // ─── Pas atteints ──────────────────────────────────────────────
  if (stepsToday > 0 && stepsToday >= stepsGoal && hour >= 14) {
    tips.push({
      id: 'steps-done',
      emoji: '👟',
      headline: `${stepsToday.toLocaleString('fr-FR')} pas — objectif atteint`,
      body: 'Bonne dépense énergétique du jour. Pense à recharger en glucides si tu as une séance prévue.',
      tone: 'green',
      actions: [],
      priority: 40,
    });
  } else if (stepsGoal > 0 && hour >= 18 && stepsToday < stepsGoal * 0.5) {
    const missing = stepsGoal - stepsToday;
    tips.push({
      id: 'steps-low',
      emoji: '🚶',
      headline: `Plus que ${missing.toLocaleString('fr-FR')} pas`,
      body: 'Une balade de 20 min après dîner et tu boucles ton objectif quotidien.',
      tone: 'lime',
      actions: [],
      priority: 45,
    });
  }

  // ─── Réservation à venir ───────────────────────────────────────
  if (ctx.hasUpcomingReservation) {
    tips.push({
      id: 'has-resa',
      emoji: '🕒',
      headline: 'Tu as un retrait planifié',
      body: 'Pense à passer chercher ta commande au créneau prévu — on te rappelle 15 min avant.',
      tone: 'orange',
      actions: [{ label: 'Voir mes commandes', type: 'reservations' }],
      priority: 55,
    });
  }

  // ─── Streak motivation ─────────────────────────────────────────
  if (ctx.daysWithEntryStreak >= 5) {
    tips.push({
      id: 'streak',
      emoji: '🔥',
      headline: `${ctx.daysWithEntryStreak} jours d'affilée`,
      body: 'Belle régularité. Continue à logger pour faire grimper ton score Social Club.',
      tone: 'orange',
      actions: [{ label: 'Voir le Club', type: 'social' }],
      priority: 35,
    });
  }

  // ─── Fallback générique ────────────────────────────────────────
  if (tips.length === 0) {
    tips.push({
      id: 'default',
      emoji: '🌱',
      headline: 'Tout est sous contrôle',
      body: 'Continue à enregistrer tes repas et garde le rythme — chaque jour compte.',
      tone: 'green',
      actions: [{ label: 'Ajouter un repas', type: 'addFood' }],
      priority: 10,
    });
  }

  // Retour : tip le plus prioritaire.
  return tips.sort((a, b) => b.priority - a.priority)[0];
}
