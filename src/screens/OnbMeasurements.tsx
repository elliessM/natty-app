import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F } from '../tokens';
import TopNav from '../shared/TopNav';
import OnboardingProgress from '../shared/OnboardingProgress';
import { btnDark, btnDarkLabel } from '../shared/Buttons';
import { useUserStore } from '../store/useUserStore';
import { hapticSelection } from '../shared/haptics';
import type { OnboardingStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Measurements'>;

export default function OnbMeasurements() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const heightCm = useUserStore((s) => s.heightCm);
  const weightKg = useUserStore((s) => s.weightKg);
  const targetWeightKg = useUserStore((s) => s.targetWeightKg);
  const setHeightCm = useUserStore((s) => s.setHeightCm);
  const setWeightKg = useUserStore((s) => s.setWeightKg);
  const setTargetWeightKg = useUserStore((s) => s.setTargetWeightKg);
  const addWeightEntry = useUserStore((s) => s.addWeightEntry);

  const isPristine = heightCm === 178 && weightKg === 75 && targetWeightKg === 72;
  const [h, setH] = useState(isPristine ? '' : String(heightCm));
  const [w, setW] = useState(isPristine ? '' : String(weightKg));
  const [tw, setTw] = useState(isPristine ? '' : String(targetWeightKg));

  const hN = parseInt(h, 10);
  const wN = parseFloat(w.replace(',', '.'));
  const twN = parseFloat(tw.replace(',', '.'));
  const hValid = Number.isFinite(hN) && hN >= 120 && hN <= 230;
  const wValid = Number.isFinite(wN) && wN >= 30 && wN <= 200;
  const twValid = Number.isFinite(twN) && twN >= 30 && twN <= 200;
  const canContinue = hValid && wValid && twValid;

  const continueNext = () => {
    setHeightCm(hN);
    setWeightKg(Math.round(wN));
    setTargetWeightKg(Math.round(twN));
    // On amorce l'historique avec ce 1er point — la courbe Stats existera dès J0.
    addWeightEntry(Math.round(wN * 10) / 10);
    navigation.navigate('Activity');
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.beige }}>
      <TopNav onBack={() => navigation.goBack()} stepText="4 / 7" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingTop: insets.top + 80, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 13, letterSpacing: 3, fontWeight: '700', color: C.green }}>ÉTAPE 04</Text>
        <Text style={{ fontFamily: F.display, fontWeight: '900', fontSize: 32, color: C.green, marginTop: 8, marginBottom: 6, lineHeight: 34 }}>
          Tes mesures
        </Text>
        <Text style={{ fontSize: 14, color: C.darkSoft, lineHeight: 20 }}>
          Données de base pour calculer ton apport calorique idéal — modifiables plus tard.
        </Text>

        {/* Taille */}
        <View style={{ marginTop: 24 }}>
          <Text style={labelStyle}>TAILLE</Text>
          <FieldRow value={h} onChange={(v) => setH(v.replace(/[^0-9]/g, ''))} unit="cm" maxLength={3} />
        </View>

        {/* Poids actuel */}
        <View style={{ marginTop: 16 }}>
          <Text style={labelStyle}>POIDS ACTUEL</Text>
          <FieldRow
            value={w}
            onChange={(v) => setW(v.replace(/[^0-9.,]/g, ''))}
            unit="kg"
            maxLength={5}
            decimal
          />
        </View>

        {/* Poids cible */}
        <View style={{ marginTop: 16 }}>
          <Text style={labelStyle}>POIDS CIBLE</Text>
          <FieldRow
            value={tw}
            onChange={(v) => setTw(v.replace(/[^0-9.,]/g, ''))}
            unit="kg"
            maxLength={5}
            decimal
          />
          {wValid && twValid ? (
            <Text style={{ fontSize: 11, color: C.green, marginTop: 8 }}>
              {twN < wN
                ? `Objectif perte de ${(wN - twN).toFixed(1)} kg`
                : twN > wN
                ? `Objectif prise de ${(twN - wN).toFixed(1)} kg`
                : 'Maintien du poids actuel'}
            </Text>
          ) : null}
        </View>

        <View style={{ flex: 1, minHeight: 40 }} />

        <View style={{ marginTop: 32, marginBottom: 16 }}>
          <OnboardingProgress step={4} total={7} />
        </View>
        <Pressable onPress={continueNext} disabled={!canContinue} style={[btnDark(), { opacity: canContinue ? 1 : 0.4 }]}>
          <Text style={btnDarkLabel}>Continuer</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function FieldRow({
  value,
  onChange,
  unit,
  maxLength,
  decimal,
}: {
  value: string;
  onChange: (v: string) => void;
  unit: string;
  maxLength: number;
  decimal?: boolean;
}) {
  return (
    <View
      style={{
        marginTop: 6,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.white,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="—"
        placeholderTextColor={C.darkSoft}
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        maxLength={maxLength}
        returnKeyType="next"
        style={{
          flex: 1,
          fontFamily: F.body,
          fontSize: 18,
          fontWeight: '700',
          color: C.dark,
          padding: 0,
        }}
      />
      <Text style={{ fontSize: 13, color: C.darkSoft, fontWeight: '600' }}>{unit}</Text>
    </View>
  );
}

const labelStyle = {
  fontSize: 11,
  letterSpacing: 2,
  color: C.green,
  fontWeight: '700' as const,
};
