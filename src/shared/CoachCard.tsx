import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C, F, cardShadow, withAlpha } from '../tokens';
import { hapticLight, hapticSelection } from './haptics';
import FoodSearchModal from '../screens/FoodSearchModal';
import { useUserStore, computeMacroTargets } from '../store/useUserStore';
import { useJournalStore, dayKey } from '../store/useJournalStore';
import { useReservationsStore, upcomingReservations } from '../store/useReservationsStore';
import { useSteps } from '../hooks/useSteps';
import { generateCoachTip, type CoachAction } from '../data/coach';

const TONE_COLORS = {
  orange: { bg: withAlpha(C.orange, 0.12), accent: C.orange },
  lime: { bg: withAlpha(C.lime, 0.18), accent: C.green },
  green: { bg: withAlpha(C.green, 0.08), accent: C.green },
  beige: { bg: C.beige, accent: C.darkSoft },
} as const;

export default function CoachCard() {
  const navigation = useNavigation<any>();
  const [searchOpen, setSearchOpen] = useState(false);

  const weightKg = useUserStore((s) => s.weightKg);
  const heightCm = useUserStore((s) => s.heightCm);
  const age = useUserStore((s) => s.age);
  const sex = useUserStore((s) => s.sex);
  const activityLevel = useUserStore((s) => s.activityLevel);
  const goal = useUserStore((s) => s.goal);
  const hydrationMl = useUserStore((s) => s.hydrationMl);
  const hydrationGoalMl = useUserStore((s) => s.hydrationGoalMl);
  const stepsGoal = useUserStore((s) => s.stepsGoal);
  const addHydration = useUserStore((s) => s.addHydration);
  const journal = useJournalStore((s) => s.entries);
  const reservations = useReservationsStore((s) => s.reservations);
  const { steps } = useSteps();

  const targets = React.useMemo(
    () => computeMacroTargets({ weightKg, heightCm, age, sex, activityLevel, goal }),
    [weightKg, heightCm, age, sex, activityLevel, goal]
  );

  const daysWithEntryStreak = React.useMemo(() => {
    const set = new Set(journal.map((e) => dayKey(e.timestamp)));
    let s = 0;
    for (let i = 0; i < 30; i++) {
      if (set.has(dayKey(Date.now() - i * 86400000))) s++;
      else break;
    }
    return s;
  }, [journal]);

  const tip = React.useMemo(
    () =>
      generateCoachTip({
        goal,
        targets,
        journal,
        hydrationMl,
        hydrationGoalMl,
        stepsToday: steps,
        stepsGoal,
        hasUpcomingReservation: upcomingReservations(reservations).length > 0,
        daysWithEntryStreak,
        hour: new Date().getHours(),
      }),
    [goal, targets, journal, hydrationMl, hydrationGoalMl, steps, stepsGoal, reservations, daysWithEntryStreak]
  );

  const tone = TONE_COLORS[tip.tone];

  const runAction = (a: CoachAction) => {
    hapticLight();
    switch (a.type) {
      case 'hydrate':
        addHydration();
        return;
      case 'addFood':
        setSearchOpen(true);
        return;
      case 'scan':
        navigation.getParent()?.getParent()?.navigate('ScannerModal');
        return;
      case 'reservations':
        navigation.navigate('Reservations');
        return;
      case 'stats':
        navigation.navigate('Stats');
        return;
      case 'map':
        navigation.getParent()?.navigate('MapTab', { screen: 'SmartMap' });
        return;
      case 'social':
        navigation.getParent()?.navigate('SocialTab');
        return;
    }
  };

  return (
    <>
      <View
        style={{
          marginTop: 16,
          marginHorizontal: 16,
          borderRadius: 20,
          backgroundColor: C.white,
          borderLeftWidth: 4,
          borderLeftColor: tone.accent,
          padding: 16,
          ...cardShadow,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: C.lime, fontWeight: '700', fontFamily: F.display }}>N</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 10, letterSpacing: 2, color: tone.accent, fontWeight: '700' }}>COACH NATTY</Text>
            <Text style={{ fontFamily: F.display, fontSize: 18, fontWeight: '900', color: C.dark, marginTop: 2, lineHeight: 22 }}>
              {tip.emoji} {tip.headline}
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 12, color: C.darkSoft, marginTop: 10, lineHeight: 18 }}>
          {tip.body}
        </Text>

        {tip.actions.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {tip.actions.map((a, i) => {
              const primary = i === 0;
              return (
                <Pressable
                  key={a.label}
                  onPress={() => runAction(a)}
                  style={({ pressed }) => ({
                    paddingVertical: 9,
                    paddingHorizontal: 14,
                    borderRadius: 999,
                    backgroundColor: primary ? tone.accent : 'transparent',
                    borderWidth: primary ? 0 : 1.5,
                    borderColor: tone.accent,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ color: primary ? C.beige : tone.accent, fontWeight: '700', fontSize: 12 }}>
                    {a.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      <FoodSearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} source="manual" />
    </>
  );
}
