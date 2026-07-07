import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { C, F, withAlpha } from '../tokens';
import TopNav from '../shared/TopNav';
import { btnDark, btnDarkLabel } from '../shared/Buttons';
import OnboardingProgress from '../shared/OnboardingProgress';
import { hapticLight } from '../shared/haptics';
import type { OnboardingStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'HowItWorks'>;

const STEPS = [
  {
    e: '📍',
    c: C.green,
    t: 'Repère ton frigo',
    s: 'Des frigos connectés Natty installés directement dans ta salle de sport, remplis de repas et snacks sains.',
  },
  {
    e: '📲',
    c: C.orange,
    t: 'Commande en 30 secondes',
    s: "Choisis tes produits et paie depuis l'app — tout de suite, ou en réservant un créneau de retrait.",
  },
  {
    e: '🔓',
    c: C.green,
    t: 'Le frigo se déverrouille',
    s: "Approche ton téléphone : le frigo s'ouvre en Bluetooth et tu récupères ta commande.",
  },
  {
    e: '🍽️',
    c: C.orange,
    t: 'Tes macros suivent',
    s: 'Chaque repas récupéré est ajouté automatiquement à ton journal nutritionnel. Zéro saisie.',
  },
];

export default function OnbHowItWorks() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: C.beige }}>
      <TopNav onBack={() => navigation.goBack()} stepText="2 / 8" />
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
          Comment ça marche ?
        </Text>
        <Text style={{ fontSize: 14, color: C.darkSoft, lineHeight: 20 }}>
          Natty, c'est la nutrition sportive en libre-service, là où tu t'entraînes.
        </Text>

        <View style={{ marginTop: 28, gap: 12 }}>
          {STEPS.map((st, i) => (
            <View
              key={st.t}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                padding: 16,
                borderRadius: 18,
                backgroundColor: C.white,
                borderWidth: 1,
                borderColor: C.beige2,
              }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  backgroundColor: withAlpha(st.c, 0.14),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 22 }}>{st.e}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: C.dark }}>
                  {i + 1}. {st.t}
                </Text>
                <Text style={{ fontSize: 12, color: C.darkSoft, marginTop: 3, lineHeight: 17 }}>{st.s}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ flex: 1, minHeight: 24 }} />

        <Pressable
          onPress={() => {
            hapticLight();
            navigation.navigate('Objectifs');
          }}
          accessibilityRole="button"
          style={btnDark()}
        >
          <Text style={btnDarkLabel}>J'ai compris, on continue</Text>
        </Pressable>

        <View style={{ marginTop: 24 }}>
          <OnboardingProgress step={2} total={8} />
        </View>
      </ScrollView>
    </View>
  );
}
