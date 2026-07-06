import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, withAlpha } from '../tokens';
import TopNav from '../shared/TopNav';
import OnboardingProgress from '../shared/OnboardingProgress';
import { btnDark, btnDarkLabel } from '../shared/Buttons';
import { useUserStore } from '../store/useUserStore';
import { hapticSelection } from '../shared/haptics';
import type { OnboardingStackParamList } from '../navigation/types';
import type { Goal } from '../types';

// Pour ces objectifs, le poids cible n'a pas de sens : on cible une hygiène
// de vie, pas un nombre sur la balance.
const GOALS_WITHOUT_TARGET: Goal[] = ['energy', 'perf'];

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Measurements'>;

export default function OnbMeasurements() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const goal = useUserStore((s) => s.goal);
  const heightCm = useUserStore((s) => s.heightCm);
  const weightKg = useUserStore((s) => s.weightKg);
  const targetWeightKg = useUserStore((s) => s.targetWeightKg);
  const setHeightCm = useUserStore((s) => s.setHeightCm);
  const setWeightKg = useUserStore((s) => s.setWeightKg);
  const setTargetWeightKg = useUserStore((s) => s.setTargetWeightKg);
  const addWeightEntry = useUserStore((s) => s.addWeightEntry);
  const showTarget = !GOALS_WITHOUT_TARGET.includes(goal);

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
  const canContinue = hValid && wValid && (!showTarget || twValid);

  const continueNext = () => {
    setHeightCm(hN);
    setWeightKg(Math.round(wN));
    // Pour énergie/perf : on aligne target sur weight (= maintien implicite).
    setTargetWeightKg(showTarget ? Math.round(twN) : Math.round(wN));
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

        {/* Poids cible — uniquement pour les objectifs orientés balance */}
        {showTarget ? (
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
        ) : (
          <View
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 14,
              backgroundColor: withAlpha(C.green, 0.06),
              borderWidth: 1,
              borderColor: withAlpha(C.green, 0.1),
              flexDirection: 'row',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 22 }}>🌿</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, letterSpacing: 1.5, color: C.green, fontWeight: '700' }}>HYGIÈNE DE VIE</Text>
              <Text style={{ fontSize: 12, color: C.darkSoft, marginTop: 4, lineHeight: 17 }}>
                Pas d'objectif balance pour toi — on optimise plutôt énergie, performance et habitudes au quotidien.
              </Text>
            </View>
          </View>
        )}

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
        gap: 6,
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
        numberOfLines={1}
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: F.bodyBold,
          fontSize: 17,
          color: C.dark,
          padding: 0,
          lineHeight: 22,
          includeFontPadding: false,
          textAlignVertical: 'center',
        }}
      />
      <Text
        style={{
          fontSize: 13,
          color: C.darkSoft,
          fontFamily: F.bodyMedium,
          lineHeight: 22,
          includeFontPadding: false,
          textAlignVertical: 'center',
          flexShrink: 0,
        }}
      >
        {unit}
      </Text>
    </View>
  );
}

const labelStyle = {
  fontSize: 11,
  letterSpacing: 2,
  color: C.green,
  fontWeight: '700' as const,
};
