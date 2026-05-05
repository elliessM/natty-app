import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { C, F } from '../tokens';
import Ambience from '../shared/Ambience';
import { btnPrimary, btnPrimaryLabel } from '../shared/Buttons';
import type { OnboardingStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'>;

const FEATURES = [
  { e: '🎯', t: 'Objectifs nutrition intelligents' },
  { e: '📍', t: 'Frigos Natty près de chez toi' },
  { e: '🏆', t: 'Social Club · communauté & défis' },
];

export default function OnbWelcome() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: C.green }}>
      <Ambience />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              backgroundColor: C.lime,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: C.lime,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 30,
              elevation: 6,
            }}
          >
            <Text
              style={{
                fontFamily: F.display,
                fontWeight: '900',
                fontSize: 48,
                color: C.green,
                lineHeight: 48,
                marginTop: -4,
              }}
            >
              N
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 11, letterSpacing: 4, fontWeight: '700', color: C.lime }}>NATTY</Text>
            <Text style={{ fontSize: 12, color: C.beige, opacity: 0.7, marginTop: 4 }}>v 2.1</Text>
          </View>
        </View>

        <View style={{ marginTop: 48 }}>
          <Text style={{ fontSize: 12, letterSpacing: 3, color: C.lime, fontWeight: '700', marginBottom: 8 }}>BIENVENUE</Text>
          <Text
            style={{
              fontFamily: F.display,
              fontWeight: '900',
              fontSize: 36,
              lineHeight: 38,
              color: C.beige,
              letterSpacing: -0.5,
            }}
          >
            Natural Energy,{'\n'}Real Results.
          </Text>
          <Text style={{ fontSize: 14, color: C.beige, opacity: 0.75, marginTop: 14, lineHeight: 20 }}>
            Ton frigo intelligent post-entraînement. Scanne, mange bien, progresse.
          </Text>
        </View>

        <View style={{ marginTop: 32, gap: 8 }}>
          {FEATURES.map((f, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 12,
                paddingHorizontal: 14,
                backgroundColor: 'rgba(252,233,218,0.06)',
                borderWidth: 1,
                borderColor: 'rgba(252,233,218,0.12)',
                borderRadius: 14,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'rgba(190,211,92,0.18)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 15 }}>{f.e}</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '500', color: C.beige }}>{f.t}</Text>
            </View>
          ))}
        </View>

        <View style={{ flex: 1, minHeight: 24 }} />

        <View style={{ marginTop: 28, gap: 10 }}>
          <Pressable onPress={() => navigation.navigate('Objectifs')} style={btnPrimary()}>
            <Text style={btnPrimaryLabel}>Configurer mon profil →</Text>
          </Pressable>
          <Text style={{ fontSize: 11, color: C.lime, opacity: 0.7, textAlign: 'center', marginTop: 4 }}>
            Étape 1 sur 7 · 2 minutes
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
