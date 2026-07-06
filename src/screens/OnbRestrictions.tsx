import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { C, F, withAlpha } from '../tokens';
import TopNav from '../shared/TopNav';
import { btnDark, btnDarkLabel, btnSkip, btnSkipLabel } from '../shared/Buttons';
import { useUserStore } from '../store/useUserStore';
import type { OnboardingStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Restrictions'>;

const OPTS = [
  { id: 'gluten', t: 'Sans gluten' },
  { id: 'lactose', t: 'Sans lactose' },
  { id: 'vege', t: 'Végétarien' },
  { id: 'vegan', t: 'Vegan' },
  { id: 'noix', t: 'Sans noix' },
  { id: 'sucre', t: 'Sans sucre' },
];

export default function OnbRestrictions() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const restrictions = useUserStore((s) => s.restrictions);
  const toggleRestriction = useUserStore((s) => s.toggleRestriction);

  return (
    <View style={{ flex: 1, backgroundColor: C.beige }}>
      <TopNav onBack={() => navigation.goBack()} stepText="6 / 7" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 40, paddingTop: insets.top + 80, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 13, letterSpacing: 3, fontWeight: '700', color: C.green }}>ÉTAPE 06</Text>
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
          Des restrictions ?
        </Text>
        <Text style={{ fontSize: 14, color: C.darkSoft, lineHeight: 20 }}>
          On filtre les produits pour toi. Tu pourras modifier plus tard.
        </Text>

        <View style={{ marginTop: 28, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {OPTS.map((o) => {
            const isSel = restrictions.includes(o.id);
            return (
              <Pressable
                key={o.id}
                onPress={() => toggleRestriction(o.id)}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 22,
                  borderRadius: 999,
                  backgroundColor: isSel ? C.green : withAlpha(C.beige, 0.5),
                  borderWidth: isSel ? 0 : 1.5,
                  borderColor: withAlpha(C.green, 0.25),
                }}
              >
                <Text style={{ color: isSel ? C.beige : C.dark, fontWeight: isSel ? '700' : '500', fontSize: 13 }}>{o.t}</Text>
              </Pressable>
            );
          })}
        </View>

        <View
          style={{
            marginTop: 28,
            padding: 16,
            borderRadius: 18,
            backgroundColor: withAlpha(C.green, 0.06),
            borderWidth: 1,
            borderColor: withAlpha(C.green, 0.1),
            flexDirection: 'row',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18 }}>💡</Text>
          </View>
          <Text style={{ flex: 1, fontSize: 12, color: C.darkSoft, lineHeight: 18 }}>
            <Text style={{ fontWeight: '700', color: C.dark }}>{restrictions.length}</Text> restriction
            {restrictions.length > 1 ? 's' : ''} sélectionnée{restrictions.length > 1 ? 's' : ''}. On adapte ton catalogue.
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ marginTop: 32, alignItems: 'center' }}>
          <View style={{ width: 200, height: 4, borderRadius: 999, backgroundColor: withAlpha(C.lime, 0.25), overflow: 'hidden' }}>
            <View style={{ width: `${(6 / 7) * 100}%`, height: '100%', backgroundColor: C.orange, borderRadius: 999 }} />
          </View>
          <Text style={{ fontSize: 11, color: C.green, letterSpacing: 2, fontWeight: '700', marginTop: 10 }}>6 / 7</Text>
        </View>

        <View style={{ marginTop: 20, gap: 8 }}>
          <Pressable onPress={() => navigation.navigate('Ready')} style={btnDark()}>
            <Text style={btnDarkLabel}>Continuer</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Ready')} style={btnSkip()}>
            <Text style={btnSkipLabel}>Passer cette étape</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
