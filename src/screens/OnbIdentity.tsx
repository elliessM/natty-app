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
import type { Sex } from '../types';
import type { OnboardingStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Identity'>;

const SEXES: Array<{ id: Sex; label: string }> = [
  { id: 'M', label: 'Homme' },
  { id: 'F', label: 'Femme' },
  { id: 'other', label: 'Autre' },
];

export default function OnbIdentity() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const name = useUserStore((s) => s.name);
  const age = useUserStore((s) => s.age);
  const sex = useUserStore((s) => s.sex);
  const setName = useUserStore((s) => s.setName);
  const setAge = useUserStore((s) => s.setAge);
  const setSex = useUserStore((s) => s.setSex);

  const [nameDraft, setNameDraft] = useState(name === 'Noé' ? '' : name);
  const [ageDraft, setAgeDraft] = useState(age === 28 ? '' : String(age));

  const ageNum = parseInt(ageDraft, 10);
  const ageValid = Number.isFinite(ageNum) && ageNum >= 12 && ageNum <= 100;
  const canContinue = nameDraft.trim().length > 0 && ageValid;

  const continueNext = () => {
    setName(nameDraft.trim());
    setAge(ageNum);
    navigation.navigate('Measurements');
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.beige }}>
      <TopNav onBack={() => navigation.goBack()} stepText="3 / 7" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingTop: insets.top + 80, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 13, letterSpacing: 3, fontWeight: '700', color: C.green }}>ÉTAPE 03</Text>
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
          Faisons connaissance
        </Text>
        <Text style={{ fontSize: 14, color: C.darkSoft, lineHeight: 20 }}>
          Quelques infos pour personnaliser tes objectifs caloriques.
        </Text>

        {/* Prénom */}
        <View style={{ marginTop: 28 }}>
          <Text style={labelStyle}>TON PRÉNOM</Text>
          <TextInput
            value={nameDraft}
            onChangeText={setNameDraft}
            placeholder="Comment tu t'appelles ?"
            placeholderTextColor={C.darkSoft}
            maxLength={24}
            autoFocus
            autoCorrect={false}
            returnKeyType="next"
            style={inputStyle}
          />
        </View>

        {/* Âge */}
        <View style={{ marginTop: 16 }}>
          <Text style={labelStyle}>ÂGE</Text>
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
              value={ageDraft}
              onChangeText={(v) => setAgeDraft(v.replace(/[^0-9]/g, ''))}
              placeholder="25"
              placeholderTextColor={C.darkSoft}
              keyboardType="number-pad"
              maxLength={3}
              returnKeyType="done"
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
                marginLeft: 6,
                includeFontPadding: false,
                textAlignVertical: 'center',
                flexShrink: 0,
              }}
            >
              ans
            </Text>
          </View>
        </View>

        {/* Sexe */}
        <View style={{ marginTop: 16 }}>
          <Text style={labelStyle}>SEXE</Text>
          <Text style={{ fontSize: 11, color: C.darkSoft, marginTop: 4 }}>
            Influence le calcul de ton métabolisme de base.
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            {SEXES.map((s) => {
              const active = sex === s.id;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => {
                    hapticSelection();
                    setSex(s.id);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 999,
                    backgroundColor: active ? C.green : C.white,
                    alignItems: 'center',
                    borderWidth: active ? 0 : 1.5,
                    borderColor: 'rgba(0,65,47,0.15)',
                  }}
                >
                  <Text style={{ color: active ? C.beige : C.dark, fontSize: 13, fontWeight: active ? '700' : '500' }}>
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ flex: 1, minHeight: 40 }} />

        <View style={{ marginTop: 32, marginBottom: 16 }}>
          <OnboardingProgress step={3} total={7} />
        </View>
        <Pressable onPress={continueNext} disabled={!canContinue} style={[btnDark(), { opacity: canContinue ? 1 : 0.4 }]}>
          <Text style={btnDarkLabel}>Continuer</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const labelStyle = {
  fontSize: 11,
  letterSpacing: 2,
  color: C.green,
  fontWeight: '700' as const,
};

const inputStyle = {
  marginTop: 6,
  backgroundColor: C.white,
  borderRadius: 14,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 16,
  fontWeight: '600' as const,
  color: C.dark,
  fontFamily: F.body,
};
