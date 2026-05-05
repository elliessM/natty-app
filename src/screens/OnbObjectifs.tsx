import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { C, F } from '../tokens';
import TopNav from '../shared/TopNav';
import { btnDark, btnDarkLabel, optionCard } from '../shared/Buttons';
import { IconCheck } from '../shared/Icons';
import { useUserStore } from '../store/useUserStore';
import type { Goal } from '../types';
import type { OnboardingStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Objectifs'>;

const GOALS: Array<{ id: Goal; t: string; s: string; e: string; c: string }> = [
  { id: 'energy', t: 'Énergie', s: 'Booster mes perfs', e: '⚡', c: C.orange },
  { id: 'muscle', t: 'Masse musculaire', s: 'Optimiser ma récupération', e: '💪', c: C.green },
  { id: 'weight', t: 'Perte de poids', s: 'Atteindre mes objectifs', e: '🔥', c: C.orange },
  { id: 'perf', t: 'Performance', s: 'Manger sain sans effort', e: '🏃', c: C.green },
];

export default function OnbObjectifs() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const goal = useUserStore((s) => s.goal);
  const setGoal = useUserStore((s) => s.setGoal);

  return (
    <View style={{ flex: 1, backgroundColor: C.beige }}>
      <TopNav onBack={() => navigation.goBack()} stepText="2 / 7" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 40, paddingTop: insets.top + 80, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 13, letterSpacing: 3, fontWeight: '700', color: C.green }}>ÉTAPE 02</Text>
        <Text
          style={{
            fontFamily: F.display,
            fontWeight: '900',
            fontSize: 32,
            color: C.green,
            marginTop: 8,
            marginBottom: 6,
            lineHeight: 34,
          }}
        >
          Qu'est-ce que tu veux atteindre ?
        </Text>
        <Text style={{ fontSize: 14, color: C.darkSoft, lineHeight: 20 }}>
          On adapte tes recommandations à ton objectif principal.
        </Text>

        <View style={{ marginTop: 28, gap: 12 }}>
          {GOALS.map((g) => {
            const isSel = goal === g.id;
            return (
              <Pressable key={g.id} onPress={() => setGoal(g.id)} style={optionCard(isSel, g.c)}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: isSel ? 'rgba(252,233,218,0.2)' : `${g.c}2e`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{g.e}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', fontSize: 16, color: isSel ? C.beige : C.dark }}>{g.t}</Text>
                  <Text style={{ fontSize: 12, color: isSel ? C.lime : C.darkSoft, marginTop: 2 }}>{g.s}</Text>
                </View>
                {isSel ? (
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: C.beige,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconCheck color={g.c} size={12} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ marginTop: 32, alignItems: 'center' }}>
          <View style={{ width: 200, height: 4, borderRadius: 999, backgroundColor: 'rgba(190,211,92,0.25)', overflow: 'hidden' }}>
            <View style={{ width: `${(2 / 7) * 100}%`, height: '100%', backgroundColor: C.orange, borderRadius: 999 }} />
          </View>
          <Text style={{ fontSize: 11, color: C.green, letterSpacing: 2, fontWeight: '700', marginTop: 10 }}>2 / 7</Text>
        </View>

        <Pressable onPress={() => navigation.navigate('Identity')} style={[btnDark(), { marginTop: 20 }]}>
          <Text style={btnDarkLabel}>Continuer</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
