import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F } from '../tokens';
import { useUserStore, computeMacroTargets } from '../store/useUserStore';
import { useJournalStore, dayKey } from '../store/useJournalStore';
import { useSteps } from '../hooks/useSteps';
import { generateChallenges, computePoints } from '../data/challenges';
import { hapticLight, hapticSelection } from '../shared/haptics';

export default function Social() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topY = insets.top + 8;

  const name = useUserStore((s) => s.name);
  const goal = useUserStore((s) => s.goal);
  const weightKg = useUserStore((s) => s.weightKg);
  const heightCm = useUserStore((s) => s.heightCm);
  const age = useUserStore((s) => s.age);
  const sex = useUserStore((s) => s.sex);
  const activityLevel = useUserStore((s) => s.activityLevel);
  const hydrationMl = useUserStore((s) => s.hydrationMl);

  const targets = useMemo(
    () => computeMacroTargets({ weightKg, heightCm, age, sex, activityLevel, goal }),
    [weightKg, heightCm, age, sex, activityLevel, goal]
  );
  const journal = useJournalStore((s) => s.entries);
  const { steps } = useSteps();

  const challenges = useMemo(
    () => generateChallenges({ goal, targets, journal, hydrationMl, stepsToday: steps }),
    [goal, targets, journal, hydrationMl, steps]
  );

  const globalCh = challenges.filter((c) => c.scope === 'global');
  const personalCh = challenges.filter((c) => c.scope === 'personal');

  const pointsEarned = computePoints(challenges);
  const basePoints = 2840;
  const points = basePoints + pointsEarned;
  const level = 4;
  const nextLvl = 3500;
  const pct = Math.min(points / nextLvl, 1);

  // Streak (simple consecutive-days calc on journal)
  const daysWithEntry = new Set(journal.map((e) => dayKey(e.timestamp)));
  const streakDays = (() => {
    let s = 0;
    for (let i = 0; i < 30; i++) {
      if (daysWithEntry.has(dayKey(Date.now() - i * 86400000))) s++;
      else break;
    }
    return s;
  })();

  const totalScans = journal.filter((e) => e.source === 'scan').length;
  const completedChallenges = challenges.filter((c) => c.current >= c.target).length;

  const shareInvite = async () => {
    hapticLight();
    try {
      await Share.share({
        message: `Rejoins-moi sur Natty, l'app qui transforme chaque repas en perf. On gagne tous les deux +1 produit offert 🍗\n\nhttps://natty.app/invite?ref=${encodeURIComponent(name)}`,
      });
    } catch {
      /* user dismissed */
    }
  };

  // Amis affichés — mock pour l'instant, vraie intégration en Phase 3+.
  const friends = [
    { n: 'Léa', pts: 3420, avatar: 'L', color: C.orange, delta: '+120' },
    { n: name || 'Tu', pts: points, avatar: (name || 'N')[0], color: C.green, delta: `+${pointsEarned}`, you: true },
    { n: 'Max', pts: 2610, avatar: 'M', color: C.lime, delta: '+60' },
    { n: 'Chloé', pts: 2180, avatar: 'C', color: '#d4a574', delta: '+45' },
  ].sort((a, b) => b.pts - a.pts);

  return (
    <View style={{ flex: 1, backgroundColor: C.beige }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <LinearGradient colors={[C.green, C.greenAlt]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ paddingBottom: 40, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(190,211,92,0.12)' }} />
          <View style={{ position: 'absolute', left: -30, bottom: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(237,126,0,0.14)' }} />

          <Text style={{ position: 'absolute', left: 20, top: topY + 12, color: C.lime, fontSize: 11, letterSpacing: 3, fontWeight: '700' }}>SOCIAL CLUB</Text>
          <Pressable
            onPress={() => navigation.navigate('HomeTab', { screen: 'Dashboard' })}
            accessibilityLabel="Fermer"
            hitSlop={12}
            style={{
              position: 'absolute',
              right: 20,
              top: topY,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(0,0,0,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: C.beige, fontSize: 18 }}>✕</Text>
          </Pressable>

          <LinearGradient
            colors={[C.orange, C.orangeSoft]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              alignSelf: 'center',
              marginTop: topY + 40,
              width: 108,
              height: 108,
              borderRadius: 54,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: C.orange,
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.4,
              shadowRadius: 40,
              elevation: 10,
            }}
          >
            <Text style={{ fontSize: 56 }}>🏆</Text>
          </LinearGradient>

          <View style={{ alignItems: 'center', marginTop: 14 }}>
            <Text style={{ fontSize: 11, letterSpacing: 2, color: C.lime, fontWeight: '700' }}>NIVEAU {level} · ATHLÈTE</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
              <Text style={{ fontFamily: F.display, fontSize: 38, fontWeight: '900', color: C.beige }}>{points.toLocaleString('fr-FR')} </Text>
              <Text style={{ fontSize: 18, color: C.lime, opacity: 0.8 }}>pts</Text>
            </View>
            {streakDays > 0 ? (
              <View style={{ marginTop: 8, paddingVertical: 5, paddingHorizontal: 12, backgroundColor: 'rgba(237,126,0,0.2)', borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 12 }}>🔥</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: C.beige }}>Streak {streakDays}j</Text>
              </View>
            ) : null}
          </View>

          <View style={{ paddingHorizontal: 40, marginTop: 20 }}>
            <View style={{ height: 8, backgroundColor: 'rgba(252,233,218,0.2)', borderRadius: 999, overflow: 'hidden' }}>
              <LinearGradient colors={[C.lime, C.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: '100%', width: `${pct * 100}%`, borderRadius: 999 }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={{ fontSize: 10, color: C.lime, opacity: 0.8 }}>Niv. {level}</Text>
              <Text style={{ fontSize: 10, color: C.lime, opacity: 0.8 }}>{nextLvl - points} pts jusqu'à Niv. {level + 1}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={{ marginHorizontal: 16, marginTop: 20, flexDirection: 'row', gap: 8 }}>
          <StatCard value={String(streakDays)} label="Streak" color={C.orange} />
          <StatCard value={String(totalScans)} label="Scans" color={C.green} />
          <StatCard value={String(completedChallenges)} label="Défis" color={C.lime} />
        </View>

        {/* Global challenges */}
        <SectionTitle>Défis communauté</SectionTitle>
        <View style={{ marginHorizontal: 16, gap: 10 }}>
          {globalCh.map((c) => (
            <ChallengeRow key={c.id} ch={c} />
          ))}
        </View>

        {/* Personal challenges */}
        <SectionTitle>Pour toi · {goalLabel(goal)}</SectionTitle>
        <View style={{ marginHorizontal: 16, gap: 10 }}>
          {personalCh.map((c) => (
            <ChallengeRow key={c.id} ch={c} onInvite={c.id === 'invite-friend' ? shareInvite : undefined} />
          ))}
        </View>

        {/* Friends */}
        <View style={{ marginTop: 24, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'baseline' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: C.dark }}>Classement · Amis</Text>
          <Pressable
            onPress={shareInvite}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
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
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
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
                backgroundColor: f.you ? 'rgba(190,211,92,0.21)' : 'transparent',
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

        {/* Invite card */}
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
          <View style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(190,211,92,0.18)' }} />
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
    </View>
  );
}

function goalLabel(goal: string): string {
  return goal === 'energy' ? 'Énergie' : goal === 'muscle' ? 'Masse musculaire' : goal === 'weight' ? 'Perte de poids' : 'Performance';
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ marginLeft: 20, marginTop: 24, marginBottom: 8, fontSize: 14, fontWeight: '700', color: C.dark }}>
      {children}
    </Text>
  );
}

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View
      style={{
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 10,
        backgroundColor: C.white,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <Text style={{ fontFamily: F.display, fontSize: 24, fontWeight: '900', color }}>{value}</Text>
      <Text style={{ fontSize: 10, color: C.darkSoft, letterSpacing: 1, marginTop: 2 }}>{label.toUpperCase()}</Text>
    </View>
  );
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
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
