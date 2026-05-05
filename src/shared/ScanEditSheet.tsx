import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, cardShadow } from '../tokens';
import { hapticSelection, hapticMedium } from './haptics';
import type { ScanCandidate } from '../store/useScanStore';

type Props = {
  visible: boolean;
  initial: ScanCandidate | null;
  onClose: () => void;
  onConfirm: (edited: ScanCandidate) => void;
};

const MULTIPLIERS = [0.5, 1, 1.5, 2];

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export default function ScanEditSheet({ visible, initial, onClose, onConfirm }: Props) {
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('0');
  const [prot, setProt] = useState('0');
  const [glu, setGlu] = useState('0');
  const [lip, setLip] = useState('0');

  // Reset à chaque ouverture / nouvelle source.
  useEffect(() => {
    if (!initial) return;
    setName(initial.food);
    setKcal(String(initial.kcal));
    setProt(String(initial.prot));
    setGlu(String(initial.glu));
    setLip(String(initial.lip));
  }, [initial?.food, visible]);

  if (!initial) return null;

  const num = (v: string) => {
    const n = parseFloat(v.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };

  const applyMultiplier = (m: number) => {
    hapticSelection();
    setKcal(String(Math.round(initial.kcal * m)));
    setProt(String(round1(initial.prot * m)));
    setGlu(String(round1(initial.glu * m)));
    setLip(String(round1(initial.lip * m)));
  };

  const handleConfirm = () => {
    hapticMedium();
    onConfirm({
      ...initial,
      food: name.trim() || initial.food,
      kcal: Math.max(0, Math.round(num(kcal))),
      prot: Math.max(0, round1(num(prot))),
      glu: Math.max(0, round1(num(glu))),
      lip: Math.max(0, round1(num(lip))),
    });
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
          <View style={{ alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: '#e0e0e0', marginBottom: 14 }} />
          <Text style={{ fontFamily: F.display, fontSize: 22, fontWeight: '900', color: C.dark }}>Modifier le repas</Text>
          <Text style={{ fontSize: 12, color: C.darkSoft, marginTop: 4 }}>
            Corrige le nom ou ajuste les quantités avant d'ajouter au journal.
          </Text>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 14 }}
            style={{ maxHeight: 460 }}
          >
            {/* Nom */}
            <Text style={labelStyle}>NOM DU PLAT</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex : Poulet grillé + Riz"
              placeholderTextColor={C.darkSoft}
              maxLength={80}
              style={{
                marginTop: 6,
                backgroundColor: C.beige,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 15,
                fontWeight: '600',
                color: C.dark,
                fontFamily: F.body,
              }}
              returnKeyType="done"
            />

            {/* Quantité raccourcis */}
            <Text style={[labelStyle, { marginTop: 16 }]}>QUANTITÉ</Text>
            <Text style={{ fontSize: 11, color: C.darkSoft, marginTop: 4 }}>
              Multiplie d'un coup toutes les valeurs si la portion réelle diffère.
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              {MULTIPLIERS.map((m) => (
                <Pressable
                  key={m}
                  onPress={() => applyMultiplier(m)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: C.beige,
                    alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: 'rgba(0,65,47,0.12)',
                  }}
                >
                  <Text style={{ color: C.dark, fontWeight: '700', fontSize: 13 }}>×{m}</Text>
                </Pressable>
              ))}
            </View>

            {/* Macros */}
            <Text style={[labelStyle, { marginTop: 18 }]}>MACROS</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <MacroField label="Calories" unit="kcal" color={C.orange} value={kcal} onChange={setKcal} flex={1.3} />
              <MacroField label="Prot" unit="g" color={C.lime} value={prot} onChange={setProt} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <MacroField label="Glucides" unit="g" color={C.green} value={glu} onChange={setGlu} />
              <MacroField label="Lipides" unit="g" color="#d4a574" value={lip} onChange={setLip} />
            </View>

            {/* Preview */}
            <View
              style={{
                marginTop: 18,
                backgroundColor: C.green,
                borderRadius: 18,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 28 }}>{initial.emoji}</Text>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 10, letterSpacing: 2, color: C.lime, fontWeight: '700' }}>APRÈS MODIF</Text>
                <Text style={{ fontFamily: F.display, fontSize: 22, fontWeight: '900', color: C.beige, marginTop: 2 }} numberOfLines={1}>
                  {Math.round(num(kcal))} kcal
                </Text>
                <Text style={{ fontSize: 11, color: C.lime, opacity: 0.85, marginTop: 2 }} numberOfLines={1}>
                  {round1(num(prot))}p · {round1(num(glu))}g · {round1(num(lip))}l
                </Text>
              </View>
            </View>
          </ScrollView>

          <Pressable
            onPress={handleConfirm}
            style={{
              marginTop: 16,
              height: 56,
              borderRadius: 28,
              backgroundColor: C.orange,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: C.orange,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 6,
            }}
          >
            <Text style={{ color: C.beige, fontWeight: '700', fontSize: 15 }}>Ajouter au journal</Text>
          </Pressable>
          <Pressable onPress={onClose} style={{ marginTop: 8, alignItems: 'center', padding: 10 }}>
            <Text style={{ color: C.darkSoft, fontWeight: '600', fontSize: 13 }}>Annuler</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function MacroField({
  label,
  unit,
  color,
  value,
  onChange,
  flex = 1,
}: {
  label: string;
  unit: string;
  color: string;
  value: string;
  onChange: (v: string) => void;
  flex?: number;
}) {
  return (
    <View
      style={{
        flex,
        backgroundColor: C.beige,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderLeftWidth: 3,
        borderLeftColor: color,
      }}
    >
      <Text style={{ fontSize: 9, fontWeight: '700', color: C.darkSoft, letterSpacing: 1 }}>{label.toUpperCase()}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4, gap: 4 }}>
        <TextInput
          value={value}
          onChangeText={(v) => onChange(v.replace(/[^0-9.,]/g, ''))}
          keyboardType="decimal-pad"
          maxLength={5}
          style={{
            fontFamily: F.display,
            fontSize: 18,
            fontWeight: '900',
            color: C.dark,
            padding: 0,
            minWidth: 40,
          }}
          returnKeyType="done"
        />
        <Text style={{ fontSize: 11, color: C.darkSoft, fontWeight: '600' }}>{unit}</Text>
      </View>
    </View>
  );
}

const labelStyle = {
  fontSize: 10,
  letterSpacing: 2,
  color: C.green,
  fontWeight: '700' as const,
};
