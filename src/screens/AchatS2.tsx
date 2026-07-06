import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { C, F, softShadow, cardShadow } from '../tokens';
import StatusBar from '../shared/StatusBar';
import { IconBack, IconPin } from '../shared/Icons';
import { formatPrice } from '../data/products';
import { PRODUCT_IMAGES } from '../data/images';
import SmartImage from '../shared/SmartImage';
import { useCartStore } from '../store/useCartStore';
import { PRODUCTS } from '../data/products';
import type { MapStackParamList } from '../navigation/types';
import type { CartItem } from '../types';

type Nav = NativeStackNavigationProp<MapStackParamList, 'AchatS2'>;

export default function AchatS2() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const backTop = insets.top + 8;
  const items = useCartStore((s) => s.items);
  const incrementItem = useCartStore((s) => s.incrementItem);
  const decrementItem = useCartStore((s) => s.decrementItem);

  // Demo fallback if cart empty (e.g. jumped directly to S2 via nav chips)
  const display: CartItem[] =
    items.length > 0
      ? items
      : [
          { ...PRODUCTS[0], qty: 1 },
          { ...PRODUCTS[1], qty: 2 },
        ];

  const subtotal = display.reduce((s, c) => s + c.price * c.qty, 0);
  const fees = 0.3;
  const discount = -subtotal * 0.05;
  const total = subtotal + fees + discount;

  return (
    <View style={{ flex: 1, backgroundColor: C.beige }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
        <View style={{ height: backTop + 58 }}>
          <StatusBar />
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityLabel="Retour"
            hitSlop={12}
            style={{
              position: 'absolute',
              left: 20,
              top: backTop,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: C.white,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5,
              ...softShadow,
            }}
          >
            <IconBack />
          </Pressable>
          <Text style={{ position: 'absolute', left: 0, right: 0, top: backTop + 12, textAlign: 'center', fontSize: 17, fontWeight: '700', color: C.dark }}>
            Récapitulatif
          </Text>
          <View
            style={{
              position: 'absolute',
              right: 16,
              top: backTop + 8,
              paddingVertical: 5,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: C.white,
              borderWidth: 1,
              borderColor: C.lime,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: C.green }}>2 / 4</Text>
          </View>
        </View>

        <Text style={{ paddingHorizontal: 20, fontSize: 13, fontWeight: '700', color: C.green }}>Ma commande</Text>
        <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 10 }}>
          {display.map((p) => (
            <View key={p.id} style={{ backgroundColor: C.white, borderRadius: 20, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center', ...cardShadow }}>
              <SmartImage
                source={PRODUCT_IMAGES[p.id]}
                fallbackEmoji={p.e}
                emojiSize={32}
                bgColor={p.color}
                style={{ width: 64, height: 64, borderRadius: 14 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', fontSize: 15, color: C.dark }}>{p.t}</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <Text style={{ fontSize: 11, color: C.green }}>● {p.kcal} kcal</Text>
                  <Text style={{ fontSize: 11, color: C.green }}>● {p.prot}g prot</Text>
                </View>
                <Text style={{ fontWeight: '700', fontSize: 14, color: C.dark, marginTop: 4 }}>{formatPrice(p.price * p.qty)} €</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.beige, padding: 4, borderRadius: 20 }}>
                <Pressable onPress={() => decrementItem(p.id)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontWeight: '700', fontSize: 16 }}>−</Text>
                </Pressable>
                <Text style={{ width: 20, textAlign: 'center', fontWeight: '700' }}>{p.qty}</Text>
                <Pressable onPress={() => incrementItem(p.id)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: C.beige, fontWeight: '700', fontSize: 16 }}>+</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            marginHorizontal: 16,
            marginTop: 14,
            height: 44,
            borderRadius: 22,
            borderWidth: 1.5,
            borderColor: C.lime,
            borderStyle: 'dashed',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: C.green, fontWeight: '700', fontSize: 13 }}>+ Ajouter un autre produit</Text>
        </Pressable>

        <Text style={{ paddingHorizontal: 20, marginTop: 30, fontSize: 13, fontWeight: '700', color: C.green }}>Point de retrait</Text>
        <View style={{ marginHorizontal: 16, marginTop: 12, backgroundColor: C.white, borderRadius: 20, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start', ...cardShadow }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' }}>
            <IconPin color={C.lime} size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', fontSize: 14, color: C.dark }}>Fitness Club Paris 11</Text>
            <Text style={{ fontSize: 11, color: C.darkSoft, marginTop: 2 }}>12 rue de la Roquette · 75011</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
              <Text style={{ fontSize: 11, color: C.dark }}>● 230 m</Text>
              <Text style={{ fontSize: 11, color: C.dark }}>● 2 min à pied</Text>
            </View>
          </View>
          <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, backgroundColor: C.lime }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.green }}>● BLE OK</Text>
          </View>
        </View>

        <Text style={{ paddingHorizontal: 20, marginTop: 30, fontSize: 13, fontWeight: '700', color: C.green }}>Détail paiement</Text>
        <View style={{ marginHorizontal: 16, marginTop: 12, backgroundColor: C.white, borderRadius: 20, padding: 16, paddingHorizontal: 20, ...cardShadow }}>
          {[
            ['Sous-total', `${formatPrice(subtotal)} €`],
            ['Frais de service', `${formatPrice(fees)} €`],
            ['Réduction Club (−5 %)', `${formatPrice(discount)} €`],
          ].map((r, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={{ fontSize: 13, color: C.darkSoft }}>{r[0]}</Text>
              <Text style={{ fontSize: 13, color: C.dark, fontWeight: '500' }}>{r[1]}</Text>
            </View>
          ))}
          <View style={{ height: 1, backgroundColor: C.lime, marginVertical: 8 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: C.dark }}>Total TTC</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ fontFamily: F.display, fontSize: 28, fontWeight: '900', color: C.green }}>{formatPrice(total)} </Text>
              <Text style={{ fontSize: 13, color: C.darkSoft }}>€</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 114,
          backgroundColor: C.white,
          paddingVertical: 20,
          paddingHorizontal: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          elevation: 8,
        }}
      >
        <Pressable
          onPress={() => navigation.navigate('AchatS3')}
          style={{
            width: '100%',
            height: 60,
            borderRadius: 30,
            backgroundColor: C.orange,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: C.orange,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 20,
            elevation: 6,
          }}
        >
          <Text style={{ color: C.beige, fontWeight: '700', fontSize: 16 }}>Payer · {formatPrice(total)} € →</Text>
        </Pressable>
      </View>
    </View>
  );
}

