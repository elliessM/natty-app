import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Share, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F, softShadow, withAlpha } from '../tokens';
import { IconBack } from '../shared/Icons';
import { useUserStore, computeMacroTargets } from '../store/useUserStore';
import { useJournalStore, dayKey } from '../store/useJournalStore';
import { useSportStore } from '../store/useSportStore';
import { useFastingStore } from '../store/useFastingStore';
import { useSteps } from '../hooks/useSteps';
import { generateChallenges, computePoints } from '../data/challenges';
import {
  getCommunityFeed,
  workoutToPost,
  fastingToPost,
  timeAgo,
  type FeedPost,
} from '../data/socialFeed';
import { hapticLight, hapticSelection } from '../shared/haptics';

type Tab = 'feed' | 'classement';

export default function Social() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<Tab>('feed');

  const name = useUserStore((s) => s.name);

  return (
    <View style={{ flex: 1, backgroundColor: C.beige }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {navigation.canGoBack() ? (
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityLabel="Retour"
            hitSlop={12}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: C.white,
              alignItems: 'center',
              justifyContent: 'center',
              ...softShadow,
            }}
          >
            <IconBack />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, letterSpacing: 3, color: C.green, fontWeight: '700' }}>COMMUNAUTÉ</Text>
          <Text style={{ fontFamily: F.display, fontSize: 22, fontWeight: '900', color: C.dark, marginTop: 2 }}>
            Le club Natty
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginTop: 8, gap: 8 }}>
        <TabPill label="Fil" active={tab === 'feed'} onPress={() => { hapticSelection(); setTab('feed'); }} />
        <TabPill label="Classement" active={tab === 'classement'} onPress={() => { hapticSelection(); setTab('classement'); }} />
      </View>

      {tab === 'feed' ? <FeedView authorName={name} /> : <RankingView />}
    </View>
  );
}

function TabPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: active ? C.green : C.white,
        borderWidth: active ? 0 : 1.5,
        borderColor: withAlpha(C.green, 0.15),
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '700', color: active ? C.beige : C.dark }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── FEED ─────────────────────────────────────────────────────────
function FeedView({ authorName }: { authorName: string }) {
  const insets = useSafeAreaInsets();
  const workouts = useSportStore((s) => s.workouts);
  const fastingHistory = useFastingStore((s) => s.history);

  const [kudosed, setKudosed] = useState<Record<string, boolean>>({});

  const feed = useMemo(() => {
    const community = getCommunityFeed();
    const mine = [
      ...workouts.slice(-3).map((w) => workoutToPost(w, authorName || 'Toi')),
      ...fastingHistory.slice(-2).map((s) => fastingToPost(s, authorName || 'Toi')),
    ];
    return [...mine, ...community].sort((a, b) => b.timestamp - a.timestamp);
  }, [workouts, fastingHistory, authorName]);

  const toggleKudos = (id: string) => {
    hapticLight();
    setKudosed((s) => ({ ...s, [id]: !s[id] }));
  };

  return (
    <FlatList
      data={feed}
      keyExtractor={(p) => p.id}
      contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 40, paddingHorizontal: 16, gap: 14 }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          kudosed={!!kudosed[item.id]}
          onKudos={() => toggleKudos(item.id)}
        />
      )}
      ListEmptyComponent={
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={{ fontSize: 40 }}>🌱</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: C.dark, marginTop: 12 }}>Fil vide</Text>
          <Text style={{ fontSize: 12, color: C.darkSoft, marginTop: 4, textAlign: 'center' }}>
            Termine une séance, un jeûne ou une commande pour alimenter le fil.
          </Text>
        </View>
      }
    />
  );
}

function PostCard({ post, kudosed, onKudos }: { post: FeedPost; kudosed: boolean; onKudos: () => void }) {
  return (
    <View
      style={{
        backgroundColor: C.white,
        borderRadius: 20,
        padding: 16,
        borderWidth: post.mine ? 1.5 : 1,
        borderColor: post.mine ? withAlpha(C.lime, 0.6) : C.beige2,
        ...softShadow,
      }}
    >
      {/* Header auteur */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: post.avatarColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: C.beige, fontWeight: '700', fontFamily: F.display, fontSize: 16 }}>
            {post.authorAvatar}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: C.dark }} numberOfLines={1}>
              {post.authorName}
            </Text>
            {post.mine ? (
              <Text style={{ fontSize: 10, color: C.green, fontWeight: '700', letterSpacing: 0.5 }}>· TOI</Text>
            ) : null}
          </View>
          <Text style={{ fontSize: 11, color: C.darkSoft, marginTop: 1 }}>
            {timeAgo(post.timestamp)} · {kindLabel(post.kind)}
          </Text>
        </View>
        <KindBadge kind={post.kind} />
      </View>

      {/* Titre & corps */}
      <Text style={{ fontFamily: F.display, fontSize: 17, fontWeight: '900', color: C.dark, marginTop: 14, lineHeight: 22 }}>
        {post.emoji ? `${post.emoji} ` : ''}{post.title}
      </Text>
      {post.body ? (
        <Text style={{ fontSize: 13, color: C.darkSoft, marginTop: 6, lineHeight: 19 }}>
          {post.body}
        </Text>
      ) : null}

      {/* Stats */}
      {post.stats && post.stats.length > 0 ? (
        <View style={{ flexDirection: 'row', marginTop: 14, gap: 10 }}>
          {post.stats.map((s) => (
            <View
              key={s.label}
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 10,
                backgroundColor: C.beige,
                borderRadius: 12,
              }}
            >
              <Text style={{ fontSize: 9, color: C.darkSoft, letterSpacing: 1.2, fontWeight: '700' }}>
                {s.label.toUpperCase()}
              </Text>
              <Text style={{ fontFamily: F.display, fontSize: 17, fontWeight: '900', color: C.green, marginTop: 2 }}>
                {s.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Actions */}
      <View
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: C.beige2,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <Pressable
          onPress={onKudos}
          hitSlop={6}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Text style={{ fontSize: 18 }}>{kudosed ? '👏' : '🤍'}</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: kudosed ? C.orange : C.darkSoft }}>
            {post.kudos + (kudosed ? 1 : 0)}
          </Text>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 16 }}>💬</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.darkSoft }}>{post.comments}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Text style={{ fontSize: 18, color: C.darkSoft }}>⋯</Text>
      </View>
    </View>
  );
}

function KindBadge({ kind }: { kind: FeedPost['kind'] }) {
  const map: Record<FeedPost['kind'], { bg: string; color: string; label: string }> = {
    workout: { bg: withAlpha(C.lime, 0.22), color: C.green, label: 'SPORT' },
    fast: { bg: withAlpha(C.orange, 0.15), color: C.orange, label: 'JEÛNE' },
    meal: { bg: withAlpha(C.green, 0.08), color: C.green, label: 'REPAS' },
    milestone: { bg: withAlpha(C.orange, 0.15), color: C.orange, label: 'PALIER' },
    order: { bg: withAlpha(C.green, 0.08), color: C.green, label: 'COMMANDE' },
  };
  const m = map[kind];
  return (
    <View style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: m.bg }}>
      <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1, color: m.color }}>{m.label}</Text>
    </View>
  );
}

function kindLabel(kind: FeedPost['kind']): string {
  switch (kind) {
    case 'workout':
      return 'Activité sportive';
    case 'fast':
      return 'Jeûne intermittent';
    case 'meal':
      return 'Repas tracké';
    case 'milestone':
      return 'Nouveau palier';
    case 'order':
      return 'Commande récupérée';
  }
}

// ─── CLASSEMENT (ex-Social) ───────────────────────────────────────
function RankingView() {
  const insets = useSafeAreaInsets();
  const name = useUserStore((s) => s.name);
  const goal = useUserStore((s) => s.goal);
  const weightKg = useUserStore((s) => s.weightKg);
  const heightCm = useUserStore((s) => s.heightCm);
  const age = useUserStore((s) => s.age);
  const sex = useUserStore((s) => s.sex);
  const activityLevel = useUserStore((s) => s.activityLevel);
  const hydrationMl = useUserStore((s) => s.hydrationMl);
  const hydrationGoalMl = useUserStore((s) => s.hydrationGoalMl);

  const targets = useMemo(
    () => computeMacroTargets({ weightKg, heightCm, age, sex, activityLevel, goal }),
    [weightKg, heightCm, age, sex, activityLevel, goal]
  );
  const journal = useJournalStore((s) => s.entries);
  const { steps } = useSteps();

  const challenges = useMemo(
    () => generateChallenges({ goal, targets, journal, hydrationMl, hydrationGoalMl, stepsToday: steps }),
    [goal, targets, journal, hydrationMl, hydrationGoalMl, steps]
  );

  const globalCh = challenges.filter((c) => c.scope === 'global');
  const personalCh = challenges.filter((c) => c.scope === 'personal');

  const pointsEarned = computePoints(challenges);
  const basePoints = 2840;
  const points = basePoints + pointsEarned;
  const level = 4;
  const nextLvl = 3500;
  const pct = Math.min(points / nextLvl, 1);

  const daysWithEntry = new Set(journal.map((e) => dayKey(e.timestamp)));
  const streakDays = (() => {
    let s = 0;
    for (let i = 0; i < 30; i++) {
      if (daysWithEntry.has(dayKey(Date.now() - i * 86400000))) s++;
      else break;
    }
    return s;
  })();

  const shareInvite = async () => {
    hapticLight();
    try {
      await Share.share({
        message: `Rejoins-moi sur Natty, l'app qui transforme chaque repas en perf. On gagne tous les deux +1 produit offert 🍗\n\nhttps://natty.app/invite?ref=${encodeURIComponent(name)}`,
      });
    } catch {
      /* dismissed */
    }
  };

  const friends = [
    { n: 'Léa', pts: 3420, avatar: 'L', color: C.orange, delta: '+120' },
    { n: name || 'Toi', pts: points, avatar: (name || 'N')[0], color: C.green, delta: `+${pointsEarned}`, you: true },
    { n: 'Max', pts: 2610, avatar: 'M', color: C.lime, delta: '+60' },
    { n: 'Chloé', pts: 2180, avatar: 'C', color: C.lipid, delta: '+45' },
  ].sort((a, b) => b.pts - a.pts);

  return (
    <ScrollView
      contentContainerStyle={{ paddingTop: 14, paddingBottom: insets.bottom + 80 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero points */}
      <LinearGradient
        colors={[C.green, C.greenAlt]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={{ marginHorizontal: 16, borderRadius: 22, padding: 20, overflow: 'hidden' }}
      >
        <View style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: withAlpha(C.lime, 0.12) }} />
        <View style={{ position: 'absolute', left: -30, bottom: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: withAlpha(C.orange, 0.14) }} />

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 11, letterSpacing: 2, color: C.lime, fontWeight: '700' }}>NIVEAU {level} · ATHLÈTE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6 }}>
            <Text style={{ fontFamily: F.display, fontSize: 38, fontWeight: '900', color: C.beige }}>
              {points.toLocaleString('fr-FR')}{' '}
            </Text>
            <Text style={{ fontSize: 18, color: C.lime, opacity: 0.8 }}>pts</Text>
          </View>
          {streakDays > 0 ? (
            <View style={{ marginTop: 8, paddingVertical: 5, paddingHorizontal: 12, backgroundColor: withAlpha(C.orange, 0.2), borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 12 }}>🔥</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: C.beige }}>Streak {streakDays}j</Text>
            </View>
          ) : null}
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <View style={{ height: 8, backgroundColor: withAlpha(C.beige, 0.2), borderRadius: 999, overflow: 'hidden' }}>
            <LinearGradient colors={[C.lime, C.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: '100%', width: `${pct * 100}%`, borderRadius: 999 }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={{ fontSize: 10, color: C.lime, opacity: 0.8 }}>Niv. {level}</Text>
            <Text style={{ fontSize: 10, color: C.lime, opacity: 0.8 }}>{nextLvl - points} pts → Niv. {level + 1}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Défis */}
      <SectionTitle>Défis communauté</SectionTitle>
      <View style={{ marginHorizontal: 16, gap: 10 }}>
        {globalCh.map((c) => (
          <ChallengeRow key={c.id} ch={c} />
        ))}
      </View>

      <SectionTitle>Pour toi · {goalLabel(goal)}</SectionTitle>
      <View style={{ marginHorizontal: 16, gap: 10 }}>
        {personalCh.map((c) => (
          <ChallengeRow key={c.id} ch={c} onInvite={c.id === 'invite-friend' ? shareInvite : undefined} />
        ))}
      </View>

      {/* Friends */}
      <View style={{ marginTop: 24, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'baseline' }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: C.dark }}>Classement · Amis</Text>
        <Pressable onPress={shareInvite} hitSlop={8}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.green }}>+ Inviter</Text>
        </Pressable>
      </View>
      <View
        style={{
          marginHorizontal: 16,
          marginTop: 8,
          backgroundColor: C.white,
          borderRadius: 18,
          paddingVertical: 6,
          ...softShadow,
        }}
      >
        {friends.map((f, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 10,
              paddingHorizontal: 14,
              gap: 10,
              backgroundColor: f.you ? withAlpha(C.lime, 0.21) : 'transparent',
              marginHorizontal: f.you ? 6 : 0,
              marginVertical: f.you ? 2 : 0,
              borderRadius: f.you ? 12 : 0,
            }}
          >
            <Text style={{ width: 22, textAlign: 'center', fontWeight: '700', fontSize: 13, color: i === 0 ? C.orange : C.darkSoft }}>
              {i === 0 ? '🥇' : `#${i + 1}`}
            </Text>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: f.color, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: C.beige, fontWeight: '700', fontFamily: F.display }}>{f.avatar}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: C.dark }}>{f.n}</Text>
                {f.you ? <Text style={{ fontSize: 10, color: C.green, fontWeight: '500' }}>(toi)</Text> : null}
              </View>
              <Text style={{ fontSize: 10, color: C.darkSoft, marginTop: 1 }}>{f.pts.toLocaleString('fr-FR')} pts</Text>
            </View>
            <Text style={{ fontSize: 11, fontWeight: '700', color: C.green }}>{f.delta}</Text>
          </View>
        ))}
      </View>

      {/* Invite */}
      <Pressable
        onPress={shareInvite}
        style={({ pressed }) => ({
          marginHorizontal: 16,
          marginTop: 16,
          borderRadius: 20,
          backgroundColor: C.green,
          padding: 20,
          overflow: 'hidden',
          opacity: pressed ? 0.92 : 1,
        })}
      >
        <View style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: withAlpha(C.lime, 0.18) }} />
        <Text style={{ fontSize: 10, letterSpacing: 3, color: C.lime, fontWeight: '700' }}>INVITER DES AMIS</Text>
        <Text style={{ fontFamily: F.display, fontSize: 22, fontWeight: '900', color: C.beige, marginTop: 6, lineHeight: 26 }}>
          +1 produit offert{'\n'}pour chaque filleul
        </Text>
        <Text style={{ fontSize: 11, color: C.lime, opacity: 0.85, marginTop: 6, lineHeight: 16 }}>
          Chacun reçoit un bon Natty quand ton pote fait sa 1ère commande.
        </Text>
        <View style={{ marginTop: 12, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: C.orange }}>
          <Text style={{ color: C.beige, fontWeight: '700', fontSize: 12 }}>Partager mon lien</Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ marginLeft: 20, marginTop: 22, marginBottom: 8, fontSize: 14, fontWeight: '700', color: C.dark }}>
      {children}
    </Text>
  );
}

function goalLabel(goal: string): string {
  return goal === 'energy' ? 'Énergie' : goal === 'muscle' ? 'Masse musculaire' : goal === 'weight' ? 'Perte de poids' : 'Performance';
}

function ChallengeRow({
  ch,
  onInvite,
}: {
  ch: ReturnType<typeof generateChallenges>[number];
  onInvite?: () => void;
}) {
  const done = ch.current >= ch.target;
  const pct = Math.min(ch.current / ch.target, 1);
  return (
    <View
      style={{
        paddingVertical: 12,
        paddingHorizontal: 14,
        backgroundColor: C.white,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: done ? 1.5 : 0,
        borderColor: done ? C.lime : 'transparent',
        ...softShadow,
      }}
    >
      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${ch.color}30`, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 22 }}>{ch.emoji}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: C.dark, flex: 1 }} numberOfLines={1}>
            {ch.title}
          </Text>
          <Text style={{ fontSize: 11, fontWeight: '700', color: done ? C.lime : C.orange }}>
            {done ? '✓ ' + ch.reward : ch.reward}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <View style={{ flex: 1, height: 5, backgroundColor: '#f0e5d7', borderRadius: 3, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${pct * 100}%`, backgroundColor: ch.color, borderRadius: 3 }} />
          </View>
          <Text style={{ fontSize: 10, color: C.darkSoft, fontWeight: '700' }}>
            {ch.current.toLocaleString('fr-FR')} / {ch.target.toLocaleString('fr-FR')}
          </Text>
        </View>
        {onInvite ? (
          <Pressable
            onPress={onInvite}
            style={{ marginTop: 8, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: C.orange }}
          >
            <Text style={{ color: C.beige, fontWeight: '700', fontSize: 11 }}>Partager l'invitation</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
