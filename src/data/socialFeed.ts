// Feed communauté — posts mock pour démo. En prod : alimenté par Supabase
// (table `social_posts` + RLS, suivi des amis).

import { C } from '../tokens';
import { WORKOUT_META, type WorkoutType } from '../store/useSportStore';

export type FeedPostKind =
  | 'workout'
  | 'fast'
  | 'meal'
  | 'milestone'
  | 'order';

export type FeedPost = {
  id: string;
  authorName: string;
  authorAvatar: string;
  avatarColor: string;
  kind: FeedPostKind;
  timestamp: number;
  title: string;
  body?: string;
  // Stats compactes affichées dans le post (3 max)
  stats?: Array<{ label: string; value: string }>;
  // Workout-specific
  workoutType?: WorkoutType;
  emoji?: string;
  kudos: number;
  comments: number;
  // Si true, post de l'utilisateur courant (style différencié)
  mine?: boolean;
};

const HOUR = 3_600_000;
const now = Date.now();

const COMMUNITY_POSTS: FeedPost[] = [
  {
    id: 'c1',
    authorName: 'Léa Marchand',
    authorAvatar: 'L',
    avatarColor: '#ed7e00',
    kind: 'workout',
    timestamp: now - 1.5 * HOUR,
    title: 'Sortie running matinale',
    body: 'Petit 10K avant le boulot 🌅 conditions parfaites.',
    workoutType: 'course',
    emoji: '🏃',
    stats: [
      { label: 'Distance', value: '10,2 km' },
      { label: 'Temps', value: '47 min' },
      { label: 'Kcal', value: '612' },
    ],
    kudos: 24,
    comments: 3,
  },
  {
    id: 'c2',
    authorName: 'Max Petit',
    authorAvatar: 'M',
    avatarColor: '#bed35c',
    kind: 'milestone',
    timestamp: now - 4 * HOUR,
    title: '🔥 7 jours de streak',
    body: 'Une semaine sans rater un repas tracké. Objectif 30j !',
    stats: [
      { label: 'Streak', value: '7j' },
      { label: 'Niveau', value: '5' },
    ],
    kudos: 18,
    comments: 5,
  },
  {
    id: 'c3',
    authorName: 'Chloé Bertin',
    authorAvatar: 'C',
    avatarColor: C.lipid,
    kind: 'fast',
    timestamp: now - 8 * HOUR,
    title: '16:8 validé',
    body: 'Premier 16:8 de la semaine. Easy.',
    stats: [
      { label: 'Durée', value: '16h05' },
      { label: 'Protocole', value: '16:8' },
    ],
    kudos: 12,
    comments: 1,
  },
  {
    id: 'c4',
    authorName: 'Tom Lefèvre',
    authorAvatar: 'T',
    avatarColor: '#00412f',
    kind: 'workout',
    timestamp: now - 14 * HOUR,
    title: 'Séance jambes lourdes',
    workoutType: 'muscu',
    emoji: '🏋️',
    body: 'PR au squat à 140kg 💪',
    stats: [
      { label: 'Durée', value: '1h15' },
      { label: 'Kcal', value: '485' },
    ],
    kudos: 31,
    comments: 8,
  },
  {
    id: 'c5',
    authorName: 'Sarah Nguyen',
    authorAvatar: 'S',
    avatarColor: '#ed7e00',
    kind: 'order',
    timestamp: now - 22 * HOUR,
    title: 'Récupéré chez Natty Châtelet',
    body: 'Bowl saumon-quinoa + smoothie, parfait post-séance.',
    stats: [
      { label: 'Articles', value: '2' },
      { label: 'Kcal', value: '720' },
    ],
    kudos: 9,
    comments: 0,
  },
  {
    id: 'c6',
    authorName: 'Yanis Aït',
    authorAvatar: 'Y',
    avatarColor: '#bed35c',
    kind: 'workout',
    timestamp: now - 32 * HOUR,
    title: 'Vélo route Bois de Vincennes',
    workoutType: 'velo',
    emoji: '🚴',
    stats: [
      { label: 'Distance', value: '42 km' },
      { label: 'Temps', value: '1h28' },
      { label: 'Kcal', value: '893' },
    ],
    kudos: 27,
    comments: 4,
  },
];

export function getCommunityFeed(): FeedPost[] {
  return [...COMMUNITY_POSTS].sort((a, b) => b.timestamp - a.timestamp);
}

export function workoutToPost(
  workout: { id: string; type: WorkoutType; timestamp: number; durationMin: number; kcal: number; note?: string },
  authorName: string
): FeedPost {
  const meta = WORKOUT_META[workout.type];
  return {
    id: `me-${workout.id}`,
    authorName,
    authorAvatar: (authorName[0] || 'N').toUpperCase(),
    avatarColor: '#00412f',
    kind: 'workout',
    timestamp: workout.timestamp,
    title: meta.label,
    body: workout.note,
    workoutType: workout.type,
    emoji: meta.emoji,
    stats: [
      { label: 'Durée', value: `${workout.durationMin} min` },
      { label: 'Kcal', value: String(workout.kcal) },
    ],
    kudos: 0,
    comments: 0,
    mine: true,
  };
}

export function fastingToPost(
  session: { id: string; startTs: number; endTs: number; targetFastH: number; completed: boolean },
  authorName: string
): FeedPost {
  const durH = (session.endTs - session.startTs) / 3_600_000;
  return {
    id: `me-fast-${session.id}`,
    authorName,
    authorAvatar: (authorName[0] || 'N').toUpperCase(),
    avatarColor: '#00412f',
    kind: 'fast',
    timestamp: session.endTs,
    title: session.completed ? `${session.targetFastH}:${24 - session.targetFastH} validé` : `Jeûne interrompu`,
    stats: [
      { label: 'Durée', value: `${durH.toFixed(1)}h` },
      { label: 'Objectif', value: `${session.targetFastH}h` },
    ],
    kudos: 0,
    comments: 0,
    mine: true,
  };
}

export function timeAgo(ts: number, now = Date.now()): string {
  const diff = now - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'à l\'instant';
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  const d = new Date(ts);
  const months = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}
