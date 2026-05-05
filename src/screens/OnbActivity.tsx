import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F } from '../tokens';
import TopNav from '../shared/TopNav';
import OnboardingProgress from '../shared/OnboardingProgress';
import { btnDark, btnDarkLabel } from '../shared/Buttons';
import { useUserStore } from '../store/useUserStore';
import { hapticSelection } from '../shared/haptics';
import type { ActivityLevel } from '../types';
import type { OnboardingStackParamList } from '../navigation/types';
import { IconCheck } from '../shared/Icons';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Activity'>;

const LEVELS: Array<{
  id: ActivityLevel;
  emoji: string;
  title: string;
  desc: string;
  color: string;
}> = [
  { id: 'sedentary', emoji: '🪑', title: 'Sédentaire', desc: 'Travail de bureau, peu de sport', color: '#d4a574' },
  { id: 'light', emoji: '🚶', title: 'Peu actif', desc: '1-3 séances ou marche quotidienne', color: C.lime },
  { id: 'active', emoji: '🏃', title: 'Actif', desc: '3-5 séances soutenues / semaine', color: C.green },
  { id: 'athlete', emoji: '🔥', title: 'Athlète', desc: '6-7 séances ou double séance', color: C.orange },
];

export default function OnbActivity() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const activityLevel = useUserStore((s) => s.activityLevel);
  const setActivityLevel = useUserStore((s) => s.setActivityLevel);

  return (
    <View style={{ flex: 1, backgroundColor: C.beige }}>
      <TopNav onBack={() => navigation.goBack()} stepText="5 / 7" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingTop: insets.top + 80, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 13, letterSpacing: 3, fontWeight: '700', color: C.green }}>ÉTAPE 05</Text>
        <Text style={{ fontFamily: F.display, fontWeight: '900', fontSize: 32, color: C.green, marginTop: 8, marginBottom: 6, lineHeight: 34 }}>
          Ton niveau d'activité ?
        </Text>
        <Text style={{ fontSize: 14, color: C.darkSoft, lineHeight: 20 }}>
          On ajuste tes calories selon ton volume d'entraînement habituel.
        </Text>

        <View style={{ marginTop: 24, gap: 10 }}>
          {LEVELS.map((l) => {
            const active = activityLevel === l.id;
            return (
              <Pressable
                key={l.id}
                onPress={() => {
                  hapticSelection();
                  setActivityLevel(l.id);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 18,
                  backgroundColor: active ? l.color : C.white,
                  borderWidth: active ? 0 : 1.5,
                  borderColor: 'rgba(0,65,47,0.15)',
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: active ? 'rgba(252,233,218,0.25)' : `${l.color}33`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{l.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: active ? C.beige : C.dark }}>{l.title}</Text>
                  <Text style={{ fontSize: 11, color: active ? C.lime : C.darkSoft, marginTop: 2 }}>{l.desc}</Text>
                </View>
                {active ? (
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: C.beige, alignItems: 'center', justifyContent: 'center' }}>
                    <IconCheck color={l.color} size={12} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={{ flex: 1, minHeight: 40 }} />

        <View style={{ marginTop: 24, marginBottom: 16 }}>
          <OnboardingProgress step={5} total={7} />
        </View>
        <Pressable onPress={() => navigation.navigate('Restrictions')} style={btnDark()}>
          <Text style={btnDarkLabel}>Continuer</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
