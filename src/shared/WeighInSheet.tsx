import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F, cardShadow, withAlpha } from '../tokens';
import { hapticSelection, hapticSuccess } from './haptics';
import { useUserStore } from '../store/useUserStore';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const STEP = 0.1;

export default function WeighInSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const currentKg = useUserStore((s) => s.weightKg);
  const targetKg = useUserStore((s) => s.targetWeightKg);
  const lastEntry = useUserStore((s) => s.weightHistory[s.weightHistory.length - 1]);
  const addWeightEntry = useUserStore((s) => s.addWeightEntry);

  const [draft, setDraft] = useState(String(currentKg));

  useEffect(() => {
    if (visible) setDraft((lastEntry?.kg ?? currentKg).toFixed(1));
  }, [visible]);

  const value = parseFloat(draft.replace(',', '.'));
  const valid = Number.isFinite(value) && value >= 30 && value <= 200;
  const delta = lastEntry ? value - lastEntry.kg : 0;
  const distanceToTarget = value - targetKg;

  const change = (d: number) => {
    hapticSelection();
    const next = Math.round((value + d) * 10) / 10;
    setDraft(next.toFixed(1));
  };

  const confirm = () => {
    if (!valid) return;
    hapticSuccess();
    addWeightEntry(Math.round(value * 10) / 10);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: C.white,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: insets.bottom + 16,
            ...cardShadow,
          }}
        >
          <View style={{ alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: C.line, marginBottom: 14 }} />
          <Text style={{ fontFamily: F.display, fontSize: 22, fontWeight: '900', color: C.dark }}>
            ⚖️ Peser aujourd'hui
          </Text>
          <Text style={{ fontSize: 12, color: C.darkSoft, marginTop: 4 }}>
            Ajoute ta mesure du matin pour mettre à jour ta courbe.
          </Text>

          {/* Input */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 }}>
            <Pressable
              onPress={() => change(-STEP)}
              style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: C.beige, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 22, fontWeight: '700', color: C.dark }}>−</Text>
            </Pressable>
            <View style={{ flex: 1, backgroundColor: C.beige, borderRadius: 18, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
              <TextInput
                value={draft}
                onChangeText={(v) => setDraft(v.replace(/[^0-9.,]/g, ''))}
                keyboardType="decimal-pad"
                maxLength={5}
                style={{
                  fontFamily: F.display,
                  fontSize: 36,
                  fontWeight: '900',
                  color: C.dark,
                  padding: 0,
                  minWidth: 110,
                  textAlign: 'center',
                }}
                returnKeyType="done"
              />
              <Text style={{ fontSize: 16, color: C.darkSoft, fontWeight: '600' }}>kg</Text>
            </View>
            <Pressable
              onPress={() => change(STEP)}
              style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 22, fontWeight: '700', color: C.beige }}>+</Text>
            </Pressable>
          </View>

          {/* Hint */}
          {valid && lastEntry ? (
            <View
              style={{
                marginTop: 14,
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 14,
                backgroundColor: withAlpha(C.lime, 0.18),
              }}
            >
              <Text style={{ fontSize: 12, color: C.dark, lineHeight: 18 }}>
                Variation depuis la dernière mesure :{' '}
                <Text style={{ fontWeight: '700', color: delta < 0 ? C.green : delta > 0 ? C.orange : C.dark }}>
                  {delta > 0 ? '+' : ''}
                  {delta.toFixed(1)} kg
                </Text>
                {targetKg ? ` · ${distanceToTarget > 0 ? '+' : ''}${distanceToTarget.toFixed(1)} kg de l'objectif` : ''}
              </Text>
            </View>
          ) : null}

          {!valid ? (
            <Text style={{ marginTop: 10, fontSize: 11, color: C.danger, fontWeight: '600' }}>
              Saisis une valeur entre 30 et 200 kg.
            </Text>
          ) : null}

          <Pressable
            onPress={confirm}
            disabled={!valid}
            style={{
              marginTop: 18,
              height: 56,
              borderRadius: 28,
              backgroundColor: valid ? C.green : C.beige3,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: valid ? 1 : 0.5,
            }}
          >
            <Text style={{ color: valid ? C.beige : C.darkSoft, fontWeight: '700', fontSize: 15 }}>
              Enregistrer ma pesée
            </Text>
          </Pressable>
          <Pressable onPress={onClose} style={{ marginTop: 8, alignItems: 'center', padding: 10 }}>
            <Text style={{ color: C.darkSoft, fontWeight: '600', fontSize: 13 }}>Annuler</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
