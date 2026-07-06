import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, TextInput, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, cardShadow, withAlpha } from '../tokens';
import { hapticSelection, hapticMedium } from './haptics';
import { macrosForPortion, type FoodHit, guessEmoji } from '../api/foods';

type Props = {
  food: FoodHit | null;
  onClose: () => void;
  onConfirm: (food: FoodHit, grams: number) => void;
};

const PRESETS = [50, 100, 150, 200, 250];

export default function PortionPickerSheet({ food, onClose, onConfirm }: Props) {
  const insets = useSafeAreaInsets();
  const [grams, setGrams] = useState<number>(food?.servingGrams && food.servingGrams > 0 ? Math.round(food.servingGrams) : 100);

  useEffect(() => {
    if (food) {
      setGrams(food.servingGrams && food.servingGrams > 0 ? Math.round(food.servingGrams) : 100);
    }
  }, [food?.code]);

  if (!food) return null;

  const macros = macrosForPortion(food, grams);
  const setPreset = (g: number) => {
    hapticSelection();
    setGrams(g);
  };

  return (
    <Modal visible={!!food} animationType="slide" transparent onRequestClose={onClose}>
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

          {/* Food header */}
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            {food.image ? (
              <Image source={{ uri: food.image }} style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: C.beige }} />
            ) : (
              <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: C.beige, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 28 }}>{guessEmoji(food.name)}</Text>
              </View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontFamily: F.display, fontSize: 18, fontWeight: '900', color: C.dark }} numberOfLines={2}>
                {food.name}
              </Text>
              {food.brand ? <Text style={{ fontSize: 11, color: C.darkSoft, marginTop: 2 }}>{food.brand}</Text> : null}
            </View>
          </View>

          {/* Portion */}
          <Text style={{ marginTop: 18, fontSize: 10, letterSpacing: 2, color: C.green, fontWeight: '700' }}>PORTION</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <Pressable
              onPress={() => {
                hapticSelection();
                setGrams((g) => Math.max(10, g - 10));
              }}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.beige, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 20, fontWeight: '700', color: C.dark }}>−</Text>
            </Pressable>
            <View style={{ flex: 1, backgroundColor: C.beige, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <TextInput
                value={String(grams)}
                onChangeText={(v) => {
                  const n = parseInt(v.replace(/[^0-9]/g, ''), 10);
                  setGrams(Number.isFinite(n) ? Math.max(1, Math.min(2000, n)) : 0);
                }}
                keyboardType="number-pad"
                maxLength={4}
                style={{
                  fontFamily: F.display,
                  fontSize: 26,
                  fontWeight: '900',
                  color: C.dark,
                  padding: 0,
                  minWidth: 70,
                  textAlign: 'center',
                }}
                returnKeyType="done"
              />
              <Text style={{ fontSize: 14, color: C.darkSoft, fontWeight: '600' }}>g</Text>
            </View>
            <Pressable
              onPress={() => {
                hapticSelection();
                setGrams((g) => Math.min(2000, g + 10));
              }}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 20, fontWeight: '700', color: C.beige }}>+</Text>
            </Pressable>
          </View>

          {/* Presets */}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
            {PRESETS.map((g) => {
              const active = grams === g;
              return (
                <Pressable
                  key={g}
                  onPress={() => setPreset(g)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: active ? C.green : C.beige,
                    alignItems: 'center',
                    borderWidth: active ? 0 : 1,
                    borderColor: withAlpha(C.green, 0.12),
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: active ? C.beige : C.dark }}>
                    {g}g
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Macros preview */}
          <View
            style={{
              marginTop: 18,
              padding: 16,
              backgroundColor: C.green,
              borderRadius: 18,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, letterSpacing: 2, color: C.lime, fontWeight: '700' }}>POUR {grams}G</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 2 }}>
                <Text style={{ fontFamily: F.display, fontSize: 32, fontWeight: '900', color: C.beige }}>{macros.kcal}</Text>
                <Text style={{ fontSize: 14, color: C.lime, marginLeft: 4 }}>kcal</Text>
              </View>
              <Text style={{ fontSize: 11, color: C.lime, opacity: 0.85, marginTop: 4 }}>
                {macros.prot}p · {macros.glu}g · {macros.lip}l
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => {
              if (grams <= 0) return;
              hapticMedium();
              onConfirm(food, grams);
            }}
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
            <Text style={{ color: C.beige, fontWeight: '700', fontSize: 15 }}>
              Ajouter au journal
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
