import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { C, F, cardShadow } from '../tokens';
import SmartImage from '../shared/SmartImage';
import { SCANNER_DEFAULT_IMAGE } from '../data/images';
import { useScanStore, type ScanCandidate } from '../store/useScanStore';
import { useJournalStore } from '../store/useJournalStore';
import { hapticLight, hapticSelection, hapticSuccess } from '../shared/haptics';
import ScanEditSheet from '../shared/ScanEditSheet';
import type { ScannerStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<ScannerStackParamList, 'ScannerResult'>;

export default function ScannerResult() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const topY = insets.top + 8;
  const candidates = useScanStore((s) => s.candidates);
  const selected = useScanStore((s) => s.selected);
  const selectCandidate = useScanStore((s) => s.selectCandidate);
  const addEntry = useJournalStore((s) => s.addEntry);

  const r: ScanCandidate =
    selected ??
    candidates[0] ?? { food: 'Poulet grillé + Riz', kcal: 520, prot: 42, glu: 58, lip: 12, confidence: 0.9, emoji: '🍗' };

  const [saved, setSaved] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(r.food);
  useEffect(() => setNameDraft(r.food), [r.food]);

  const macros = [
    { l: 'Calories', v: r.kcal, u: 'kcal', c: C.orange, pct: 0.24 },
    { l: 'Protéines', v: r.prot, u: 'g', c: C.lime, pct: 0.32 },
    { l: 'Glucides', v: r.glu, u: 'g', c: C.green, pct: 0.23 },
    { l: 'Lipides', v: r.lip, u: 'g', c: '#d4a574', pct: 0.18 },
  ];

  const closeModal = () => navigation.getParent()?.goBack();

  const saveToJournal = () => {
    addEntry({
      source: 'scan',
      timestamp: Date.now(),
      food: nameDraft.trim() || r.food,
      emoji: r.emoji,
      kcal: r.kcal,
      prot: r.prot,
      glu: r.glu,
      lip: r.lip,
    });
    hapticSuccess();
    setSaved(true);
    setTimeout(closeModal, 700);
  };

  const saveEdited = (edited: ScanCandidate) => {
    addEntry({
      source: 'scan',
      timestamp: Date.now(),
      food: edited.food,
      emoji: edited.emoji,
      kcal: edited.kcal,
      prot: edited.prot,
      glu: edited.glu,
      lip: edited.lip,
    });
    hapticSuccess();
    setEditOpen(false);
    setSaved(true);
    setTimeout(closeModal, 700);
  };

  const alternatives = candidates.filter((c) => c.food !== r.food).slice(0, 2);

  return (
    <View style={{ flex: 1, backgroundColor: C.beige }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[C.green, C.greenAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ height: 280, overflow: 'hidden' }}
        >
          <View style={{ position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(237,126,0,0.2)' }} />
          <View style={{ position: 'absolute', left: -50, bottom: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(190,211,92,0.2)' }} />
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityLabel="Rescanner"
            hitSlop={12}
            style={{
              position: 'absolute',
              left: 20,
              top: topY,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(0,0,0,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path d="M15 6l-6 6 6 6" stroke={C.beige} strokeWidth={2.2} strokeLinecap="round" fill="none" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <Text style={{ position: 'absolute', left: 0, right: 0, top: topY + 14, textAlign: 'center', color: C.beige, fontSize: 15, fontWeight: '700' }}>
            Résultat
          </Text>
          <View style={{ position: 'absolute', right: 20, top: topY + 14, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 12, backgroundColor: C.lime }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.green }}>● IA · {Math.round(r.confidence * 100)}%</Text>
          </View>
          <View
            style={{
              position: 'absolute',
              left: '50%',
              top: 110,
              marginLeft: -70,
              width: 140,
              height: 140,
              borderRadius: 70,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.25,
              shadowRadius: 50,
              elevation: 10,
            }}
          >
            <SmartImage source={SCANNER_DEFAULT_IMAGE} fallbackEmoji={r.emoji} emojiSize={80} bgColor={C.beige} style={{ flex: 1 }} />
          </View>
        </LinearGradient>

        {/* Identified */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: -32,
            backgroundColor: C.white,
            borderRadius: 24,
            padding: 20,
            ...cardShadow,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 11, letterSpacing: 3, color: C.orange, fontWeight: '700' }}>IDENTIFIÉ · MODIFIABLE</Text>
            <Pressable
              onPress={() => {
                hapticLight();
                setEditOpen(true);
              }}
              hitSlop={8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={{ fontSize: 12 }}>⚖️</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.green }}>Quantité</Text>
            </Pressable>
          </View>
          {/* Nom éditable directement (tap pour modifier) */}
          <TextInput
            value={nameDraft}
            onChangeText={setNameDraft}
            multiline
            maxLength={80}
            placeholder="Décris ton plat…"
            placeholderTextColor={C.darkSoft}
            style={{
              fontFamily: F.display,
              fontSize: 24,
              fontWeight: '900',
              color: C.dark,
              marginTop: 6,
              lineHeight: 28,
              padding: 0,
              minHeight: 30,
            }}
            returnKeyType="done"
            blurOnSubmit
          />
          <Text style={{ fontSize: 10, color: C.darkSoft, marginTop: 2 }}>
            ✏️ Tape sur le nom pour le corriger
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <View style={{ paddingVertical: 5, paddingHorizontal: 12, borderRadius: 12, backgroundColor: C.lime }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: C.green }}>✓ Post-training</Text>
            </View>
            <View style={{ paddingVertical: 5, paddingHorizontal: 12, borderRadius: 12, backgroundColor: C.beige }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: C.green }}>Objectif compatible</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 18 }}>
            {macros.map((m, i) => (
              <View key={i} style={{ flex: i === 0 ? 1.3 : 1, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 14, backgroundColor: C.beige }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: C.darkSoft, letterSpacing: 1 }}>{m.l.toUpperCase()}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 4 }}>
                  <Text style={{ fontFamily: F.display, fontSize: 20, fontWeight: '900', color: C.dark }}>{m.v}</Text>
                  <Text style={{ fontSize: 10, color: C.darkSoft }}>{m.u}</Text>
                </View>
                <View style={{ height: 4, backgroundColor: 'rgba(0,65,47,0.1)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${m.pct * 100}%`, backgroundColor: m.c, borderRadius: 2 }} />
                </View>
              </View>
            ))}
          </View>

          <View style={{ marginTop: 16, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: 'rgba(190,211,92,0.2)', borderRadius: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: C.lime, fontWeight: '700', fontFamily: F.display }}>N</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: C.green, letterSpacing: 1 }}>COACH NATTY</Text>
              <Text style={{ fontSize: 12, color: C.dark, marginTop: 4, lineHeight: 18 }}>
                Excellent choix post-workout ! Tu couvres {Math.round((r.prot / 130) * 100)}% de tes protéines journalières d'un coup.
              </Text>
            </View>
          </View>
        </View>

        {/* Alternatives — autres résultats possibles */}
        {alternatives.length > 0 ? (
          <>
            <Text style={{ marginLeft: 20, marginTop: 24, fontSize: 13, fontWeight: '700', color: C.dark }}>
              C'est plutôt ça ?
            </Text>
            <Text style={{ marginLeft: 20, marginTop: 2, fontSize: 11, color: C.darkSoft }}>
              Tape un autre résultat si l'IA s'est trompée.
            </Text>
            <View style={{ marginHorizontal: 16, marginTop: 10, gap: 8 }}>
              {alternatives.map((c) => (
                <Pressable
                  key={c.food}
                  onPress={() => {
                    hapticSelection();
                    selectCandidate(c);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    backgroundColor: C.white,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: C.beige2,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: C.beige, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: C.dark }} numberOfLines={1}>
                      {c.food}
                    </Text>
                    <Text style={{ fontSize: 11, color: C.green, fontWeight: '600', marginTop: 2 }}>
                      {c.kcal} kcal · {c.prot}g prot
                    </Text>
                  </View>
                  <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: C.beige }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: C.darkSoft }}>{Math.round(c.confidence * 100)}%</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* Bottom CTA bar */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: C.white,
          paddingTop: 12,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 12,
          flexDirection: 'row',
          gap: 8,
          borderTopWidth: 1,
          borderTopColor: C.beige2,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityLabel="Rescanner"
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            borderWidth: 1.5,
            borderColor: C.green,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: C.green, fontWeight: '700', fontSize: 18 }}>⟲</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            hapticLight();
            setEditOpen(true);
          }}
          accessibilityLabel="Modifier avant d'ajouter"
          style={{
            paddingHorizontal: 18,
            height: 52,
            borderRadius: 26,
            borderWidth: 1.5,
            borderColor: C.green,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 6,
          }}
        >
          <Text style={{ fontSize: 14 }}>✏️</Text>
          <Text style={{ color: C.green, fontWeight: '700', fontSize: 13 }}>Modifier</Text>
        </Pressable>
        <Pressable
          onPress={saveToJournal}
          disabled={saved}
          style={{
            flex: 1,
            height: 52,
            borderRadius: 26,
            backgroundColor: saved ? C.lime : C.orange,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: C.orange,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 6,
          }}
        >
          <Text style={{ color: saved ? C.green : C.beige, fontWeight: '700', fontSize: 13 }}>
            {saved ? '✓ Ajouté' : 'Ajouter'}
          </Text>
        </Pressable>
      </View>

      <ScanEditSheet
        visible={editOpen}
        initial={r}
        onClose={() => setEditOpen(false)}
        onConfirm={saveEdited}
      />
    </View>
  );
}
