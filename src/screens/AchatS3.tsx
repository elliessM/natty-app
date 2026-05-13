import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F, softShadow } from '../tokens';
import StatusBar from '../shared/StatusBar';
import HomeIndicator from '../shared/HomeIndicator';
import { IconBack, IconCheck } from '../shared/Icons';
import { formatPrice, PRODUCTS } from '../data/products';
import { useCartStore } from '../store/useCartStore';
import { useReservationsStore } from '../store/useReservationsStore';
import { FRIDGES } from '../data/fridges';
import { hapticMedium, hapticSelection, hapticSuccess } from '../shared/haptics';
import type { MapStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<MapStackParamList, 'AchatS3'>;

const METHODS = [
  { id: 'applepay', t: 'Apple Pay', s: '•••• 4 821', e: '' },
  { id: 'card', t: 'Carte Visa', s: '•••• 1 234', e: '💳' },
  { id: 'crypto', t: 'Natty Credits', s: 'Solde : 42,80 EUR', e: '⚡' },
];

export default function AchatS3() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<MapStackParamList, 'AchatS3'>>();
  const insets = useSafeAreaInsets();
  const backTop = insets.top + 8;
  const [mode, setMode] = useState('applepay');
  const [loading, setLoading] = useState(false);

  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const createReservation = useReservationsStore((s) => s.createReservation);
  const display = items.length > 0
    ? items
    : [
        { ...PRODUCTS[0], qty: 1 },
        { ...PRODUCTS[1], qty: 2 },
      ];

  const total = display.reduce((s, c) => s + c.price * c.qty, 0) * 0.95 + 0.3;
  const pickupAt = route.params?.pickupAt;
  const isScheduled = !!pickupAt;

  const pay = () => {
    hapticMedium();
    setLoading(true);
    setTimeout(() => {
      if (isScheduled && pickupAt) {
        // Flow programmé : on crée la résa payée maintenant, on revient au tracking
        const fridge = FRIDGES.find((f) => f.open) ?? FRIDGES[0];
        const id = createReservation({
          items: [...items],
          fridgeId: fridge.id,
          fridgeName: fridge.name,
          fridgeAddr: fridge.addr,
          pickupTimestamp: pickupAt,
          total,
          paymentTiming: 'now',
          paidAt: Date.now(),
        });
        hapticSuccess();
        clearCart();
        navigation.getParent()?.navigate('HomeTab', { screen: 'OrderTracking', params: { id } });
      } else {
        // Flow immédiat (au frigo) : BLE approche puis unlock
        navigation.navigate('AchatS4');
      }
    }, 1400);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.beige, overflow: 'hidden' }}>
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
      <Text style={{ position: 'absolute', left: 0, right: 0, top: backTop + 12, textAlign: 'center', fontSize: 17, fontWeight: '700', color: C.dark }}>Paiement</Text>
      <View style={{ position: 'absolute', right: 16, top: backTop + 8, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.lime }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: C.green }}>3 / 4</Text>
      </View>

      <LinearGradient
        colors={[C.green, C.greenAlt]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', left: 16, right: 16, top: backTop + 70, borderRadius: 24, padding: 24, overflow: 'hidden' }}
      >
        <View style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(190,211,92,0.15)' }} />
        <Text style={{ fontSize: 11, letterSpacing: 3, color: C.lime, fontWeight: '700' }}>TOTAL À PAYER</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6 }}>
          <Text style={{ fontFamily: F.display, fontSize: 56, fontWeight: '900', color: C.beige, letterSpacing: -1 }}>{formatPrice(total)}</Text>
          <Text style={{ fontSize: 20, marginLeft: 6, color: C.beige, opacity: 0.7 }}>EUR</Text>
        </View>
        <Text style={{ fontSize: 12, color: C.lime, opacity: 0.8, marginTop: 2 }}>
          {display.length} article{display.length > 1 ? 's' : ''} · Club −5%
          {isScheduled ? ' · Retrait programmé' : ''}
        </Text>
      </LinearGradient>

      <Text style={{ position: 'absolute', left: 20, top: backTop + 280, fontSize: 13, fontWeight: '700', color: C.green }}>Méthode de paiement</Text>
      <View style={{ position: 'absolute', left: 16, right: 16, top: backTop + 308, gap: 10 }}>
        {METHODS.map((p) => {
          const active = mode === p.id;
          return (
            <Pressable
              key={p.id}
              onPress={() => {
                hapticSelection();
                setMode(p.id);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 18,
                backgroundColor: active ? C.green : C.white,
                borderWidth: active ? 0 : 1.5,
                borderColor: 'rgba(0,65,47,0.15)',
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: active ? 'rgba(252,233,218,0.2)' : C.beige, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20 }}>{p.e}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: active ? C.beige : C.dark }}>{p.t}</Text>
                <Text style={{ fontSize: 11, opacity: 0.7, marginTop: 2, color: active ? C.beige : C.dark }}>{p.s}</Text>
              </View>
              {active ? (
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' }}>
                  <IconCheck size={12} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 92, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: 'rgba(0,65,47,0.06)', borderRadius: 14, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 16 }}>🔒</Text>
        </View>
        <Text style={{ flex: 1, fontSize: 11, color: C.darkSoft, lineHeight: 16 }}>
          {isScheduled
            ? "Paiement sécurisé · La commande sera bloquée pour ton créneau, retrait via BLE."
            : "Paiement sécurisé · Le frigo s'ouvrira automatiquement à l'arrivée via BLE."}
        </Text>
      </View>

      <View style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 20 }}>
        <Pressable
          onPress={pay}
          disabled={loading}
          style={{
            width: '100%',
            height: 60,
            borderRadius: 30,
            backgroundColor: loading ? C.green : C.orange,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            shadowColor: C.orange,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: loading ? 0 : 0.35,
            shadowRadius: 20,
            elevation: loading ? 0 : 6,
          }}
        >
          {loading ? (
            <>
              <ActivityIndicator color={C.lime} />
              <Text style={{ color: C.beige, fontWeight: '700', fontSize: 16 }}>Paiement en cours...</Text>
            </>
          ) : (
            <Text style={{ color: C.beige, fontWeight: '700', fontSize: 16 }}>🔒 Payer · {formatPrice(total)} EUR</Text>
          )}
        </Pressable>
      </View>
      <HomeIndicator />
    </View>
  );
}
