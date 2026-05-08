import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { C, softShadow } from '../tokens';
import { IconBack, IconArrow } from '../shared/Icons';
import { PRODUCTS, formatPrice } from '../data/products';
import { PRODUCT_IMAGES } from '../data/images';
import SmartImage from '../shared/SmartImage';
import { useCartStore } from '../store/useCartStore';
import { useReservationsStore } from '../store/useReservationsStore';
import { FRIDGES } from '../data/fridges';
import { hapticLight, hapticMedium, hapticSuccess } from '../shared/haptics';
import TimeSlotPickerModal from '../shared/TimeSlotPickerModal';
import type { MapStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<MapStackParamList, 'AchatS1'>;

const FILTERS = ['Tout', 'Repas', 'Snacks', 'Boissons', 'Végé'] as const;
type FilterId = (typeof FILTERS)[number];

// Mapping explicite filter UI → catégorie produit (évite les replace('s','')
// qui cassaient sur "Repas" → "Repa")
const FILTER_TO_CAT: Record<FilterId, string | null> = {
  'Tout': null,
  'Repas': 'Repas',
  'Snacks': 'Snack',
  'Boissons': 'Boisson',
  'Végé': 'Végé',
};

export default function AchatS1() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('Tout');
  const [pickerOpen, setPickerOpen] = useState(false);
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clear);
  const subtotal = useCartStore((s) => s.subtotal());
  const createReservation = useReservationsStore((s) => s.createReservation);

  // Frigo courant : le premier ouvert (quand la vraie nav transmettra l'id on le remplacera).
  const currentFridge = FRIDGES.find((f) => f.open) ?? FRIDGES[0];

  const handleReserve = (pickupTs: number) => {
    const total = items.reduce((s, c) => s + c.price * c.qty, 0) * 0.95 + 0.3;
    createReservation({
      items: [...items],
      fridgeId: currentFridge.id,
      fridgeName: currentFridge.name,
      fridgeAddr: currentFridge.addr,
      pickupTimestamp: pickupTs,
      total,
    });
    hapticSuccess();
    clearCart();
    setPickerOpen(false);
    navigation.getParent()?.navigate('HomeTab', { screen: 'Reservations' });
  };

  const targetCat = FILTER_TO_CAT[filter as FilterId] ?? null;
  const filtered = PRODUCTS.filter((p) => !targetCat || p.cat === targetCat);

  return (
    <View style={{ flex: 1, backgroundColor: C.beige }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: insets.top + 8, gap: 12 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityLabel="Retour"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: C.white,
            alignItems: 'center',
            justifyContent: 'center',
            ...softShadow,
          }}
        >
          <IconBack />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: C.dark }}>Frigo Natty</Text>
          <Text style={{ fontSize: 11, color: C.darkSoft, marginTop: 2 }}>Fitness Club Paris 11</Text>
        </View>
        <View style={{ paddingVertical: 5, paddingHorizontal: 12, borderRadius: 12, backgroundColor: C.lime }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: C.green }}>● Ouvert</Text>
        </View>
      </View>

      {/* Hero */}
      <LinearGradient
        colors={[C.green, C.greenAlt]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ marginTop: 16, marginHorizontal: 16, height: 180, borderRadius: 24, overflow: 'hidden', padding: 20 }}
      >
        <View style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(237,126,0,0.35)' }} />
        <View style={{ position: 'absolute', left: -40, bottom: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(190,211,92,0.3)' }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.lime }} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.beige }}>12 produits disponibles</Text>
        </View>
        <View
          style={{
            position: 'absolute',
            left: '50%',
            top: 40,
            marginLeft: -60,
            width: 120,
            height: 110,
            backgroundColor: C.beige,
            borderRadius: 12,
            borderWidth: 3,
            borderColor: C.dark,
          }}
        >
          <View style={{ position: 'absolute', left: '50%', top: 22, width: 4, height: 34, backgroundColor: C.green, borderRadius: 2, marginLeft: -2 }} />
          <View style={{ position: 'absolute', left: 8, top: 8, right: 8, height: 40, backgroundColor: 'rgba(237,126,0,0.55)', borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 20 }}>🍗 🥗</Text>
          </View>
          <View style={{ position: 'absolute', left: 8, top: 54, right: 8, height: 40, backgroundColor: 'rgba(190,211,92,0.55)', borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18 }}>🥤 🍫</Text>
          </View>
        </View>
        <View style={{ position: 'absolute', right: 16, bottom: 14, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14, backgroundColor: C.white }}>
          <Text style={{ fontSize: 11, fontWeight: '500', color: C.dark }}>📍 230m · 2min</Text>
        </View>
      </LinearGradient>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16, maxHeight: 40 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={{
              paddingVertical: 9,
              paddingHorizontal: 18,
              borderRadius: 17,
              backgroundColor: filter === f ? C.green : C.white,
              borderWidth: filter === f ? 0 : 1,
              borderColor: C.lime,
            }}
          >
            <Text style={{ color: filter === f ? C.beige : C.dark, fontSize: 13, fontWeight: filter === f ? '700' : '500' }}>{f}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Product grid — fills remaining vertical space */}
      <ScrollView
        style={{ flex: 1, marginTop: 12 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: items.length > 0 ? 130 : 20 }}
      >
        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 8 }}>
            <Text style={{ fontSize: 44 }}>🕵️</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: C.dark, marginTop: 6 }}>Rien dans cette catégorie</Text>
            <Text style={{ fontSize: 12, color: C.darkSoft, textAlign: 'center', maxWidth: 260, lineHeight: 17 }}>
              Aucun produit ne correspond au filtre <Text style={{ fontWeight: '700' }}>{filter}</Text>. Essaie un autre
              filtre.
            </Text>
            <Pressable
              onPress={() => setFilter('Tout')}
              style={{
                marginTop: 14,
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 999,
                backgroundColor: C.green,
              }}
            >
              <Text style={{ color: C.beige, fontWeight: '700', fontSize: 13 }}>Voir tous les produits</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {filtered.map((p) => {
            const inCart = items.find((c) => c.id === p.id);
            return (
              <View
                key={p.id}
                style={{
                  width: '48%',
                  borderRadius: 20,
                  backgroundColor: C.white,
                  borderWidth: inCart ? 2 : 1,
                  borderColor: inCart ? C.orange : 'transparent',
                  padding: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.04,
                  shadowRadius: 12,
                  elevation: 2,
                }}
              >
                <View style={{ height: 110, borderRadius: 14, overflow: 'hidden' }}>
                  <SmartImage
                    source={PRODUCT_IMAGES[p.id]}
                    fallbackEmoji={p.e}
                    emojiSize={48}
                    bgColor={p.color}
                    style={{ flex: 1 }}
                  />
                  <View style={{ position: 'absolute', left: 8, top: 8, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 10, backgroundColor: C.white }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: C.dark }}>{p.cat}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: C.dark, marginTop: 10 }}>{p.t}</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                  <Text style={{ fontSize: 11, color: C.green, fontWeight: '500' }}>● {p.kcal} kcal</Text>
                  <Text style={{ fontSize: 11, color: C.green, fontWeight: '500' }}>● {p.prot}g prot</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: C.dark }}>{formatPrice(p.price)}</Text>
                    <Text style={{ fontSize: 10, color: C.darkSoft, marginLeft: 4 }}>EUR</Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      hapticLight();
                      addItem(p);
                    }}
                    accessibilityLabel={`Ajouter ${p.t}`}
                    style={{
                      minWidth: 36,
                      paddingHorizontal: 10,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: C.orange,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: C.white, fontWeight: '700', fontSize: 14 }}>{inCart ? `${inCart.qty} +` : '+'}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky CTA — only when cart has items */}
      {items.length > 0 ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: C.white,
            paddingTop: 14,
            paddingHorizontal: 16,
            paddingBottom: 24,
            gap: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 20,
            elevation: 8,
          }}
        >
          <Pressable
            onPress={() => {
              hapticMedium();
              navigation.navigate('AchatS2');
            }}
            style={{
              height: 54,
              borderRadius: 28,
              backgroundColor: C.orange,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              shadowColor: C.orange,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 20,
              elevation: 6,
            }}
          >
            <Text style={{ color: C.beige, fontWeight: '700', fontSize: 15 }}>
              Acheter maintenant · {formatPrice(subtotal)} EUR
            </Text>
            <IconArrow />
          </Pressable>
          <Pressable
            onPress={() => {
              hapticLight();
              setPickerOpen(true);
            }}
            style={{
              height: 44,
              borderRadius: 22,
              borderWidth: 1.5,
              borderColor: C.green,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 14 }}>🕒</Text>
            <Text style={{ color: C.green, fontWeight: '700', fontSize: 13 }}>Commander pour plus tard</Text>
          </Pressable>
        </View>
      ) : null}

      <TimeSlotPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={handleReserve}
        title="Programmer ma commande"
        subtitle={`Bloque ${items.length} article${items.length > 1 ? 's' : ''} chez ${currentFridge.name} pour le créneau de ton choix.`}
        ctaLabel={`Programmer · ${formatPrice(subtotal * 0.95 + 0.3)} EUR`}
      />
    </View>
  );
}
