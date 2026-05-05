import React from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F, softShadow, cardShadow } from '../tokens';
import { IconBack, IconPin, IconClock } from '../shared/Icons';
import {
  useReservationsStore,
  upcomingReservations,
  pastReservations,
  reservationStatus,
  formatPickupTime,
  countdownLabel,
  type Reservation,
} from '../store/useReservationsStore';
import { formatPrice } from '../data/products';
import { hapticLight, hapticWarning } from '../shared/haptics';
import type { HomeStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Reservations'>;

export default function Reservations() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const reservations = useReservationsStore((s) => s.reservations);
  const cancelReservation = useReservationsStore((s) => s.cancelReservation);

  const upcoming = upcomingReservations(reservations);
  const past = pastReservations(reservations);

  const confirmCancel = (r: Reservation) => {
    Alert.alert(
      'Annuler la réservation ?',
      `${r.items.length} article${r.items.length > 1 ? 's' : ''} chez ${r.fridgeName} · ${formatPickupTime(r.pickupTimestamp)}`,
      [
        { text: 'Garder', style: 'cancel' },
        {
          text: 'Annuler la résa',
          style: 'destructive',
          onPress: () => {
            hapticWarning();
            cancelReservation(r.id);
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.beige }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityLabel="Retour"
          hitSlop={12}
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
          <Text style={{ fontSize: 11, letterSpacing: 3, color: C.green, fontWeight: '700' }}>MES RÉSERVATIONS</Text>
          <Text style={{ fontFamily: F.display, fontSize: 24, fontWeight: '900', color: C.dark, marginTop: 2 }}>
            {upcoming.length > 0 ? `${upcoming.length} à venir` : 'Aucune à venir'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
        {upcoming.length === 0 && past.length === 0 ? (
          <View style={{ marginHorizontal: 16, marginTop: 40 }}>
            <LinearGradient
              colors={[C.green, C.greenAlt]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 22, padding: 28, alignItems: 'center', overflow: 'hidden' }}
            >
              <View style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(190,211,92,0.15)' }} />
              <View style={{ position: 'absolute', left: -30, bottom: -50, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(237,126,0,0.18)' }} />
              <Text style={{ fontSize: 56 }}>📦</Text>
              <Text style={{ fontFamily: F.display, fontSize: 22, fontWeight: '900', color: C.beige, textAlign: 'center', marginTop: 12, lineHeight: 26 }}>
                Réserve ton repas{'\n'}avant la séance
              </Text>
              <Text style={{ fontSize: 12, color: C.lime, opacity: 0.85, textAlign: 'center', lineHeight: 18, marginTop: 10, maxWidth: 280 }}>
                Choisis un Smart Fridge, ton créneau de retrait, et viens chercher au moment qui t'arrange.
              </Text>
              <Pressable
                onPress={() => {
                  hapticLight();
                  navigation.getParent()?.navigate('MapTab', { screen: 'SmartMap' });
                }}
                style={{ marginTop: 18, paddingVertical: 12, paddingHorizontal: 22, borderRadius: 999, backgroundColor: C.orange }}
              >
                <Text style={{ color: C.beige, fontWeight: '700', fontSize: 13 }}>Choisir un frigo →</Text>
              </Pressable>
            </LinearGradient>
          </View>
        ) : null}

        {upcoming.length > 0 ? (
          <>
            <Text style={sectionTitle}>À VENIR</Text>
            <View style={{ marginHorizontal: 16, gap: 10 }}>
              {upcoming.map((r) => (
                <ReservationCard key={r.id} r={r} onCancel={() => confirmCancel(r)} />
              ))}
            </View>
          </>
        ) : null}

        {past.length > 0 ? (
          <>
            <Text style={sectionTitle}>HISTORIQUE</Text>
            <View style={{ marginHorizontal: 16, gap: 10 }}>
              {past.slice(0, 10).map((r) => (
                <ReservationCard key={r.id} r={r} historical />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function ReservationCard({
  r,
  onCancel,
  historical,
}: {
  r: Reservation;
  onCancel?: () => void;
  historical?: boolean;
}) {
  const status = reservationStatus(r);
  const isReady = status === 'ready';
  const isCancelled = status === 'cancelled';

  return (
    <View
      style={{
        backgroundColor: C.white,
        borderRadius: 20,
        padding: 16,
        borderWidth: isReady ? 1.5 : 1,
        borderColor: isReady ? C.orange : C.beige2,
        opacity: historical && isCancelled ? 0.55 : 1,
        ...cardShadow,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 11, letterSpacing: 2, color: C.green, fontWeight: '700' }}>
            {statusLabel(status)}
          </Text>
          <Text style={{ fontFamily: F.display, fontSize: 18, fontWeight: '900', color: C.dark, marginTop: 4 }}>
            {formatPickupTime(r.pickupTimestamp)}
          </Text>
          {!historical ? (
            <Text style={{ fontSize: 12, color: isReady ? C.orange : C.darkSoft, fontWeight: isReady ? '700' : '500', marginTop: 2 }}>
              {isReady ? 'Ton retrait est dispo' : countdownLabel(r.pickupTimestamp)}
            </Text>
          ) : null}
        </View>
        <Text style={{ fontFamily: F.display, fontSize: 18, fontWeight: '900', color: C.green }}>
          {formatPrice(r.total)} €
        </Text>
      </View>

      {/* Items */}
      <View style={{ marginTop: 12, gap: 6 }}>
        {r.items.map((it) => (
          <View key={it.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 18 }}>{it.e}</Text>
            <Text style={{ flex: 1, fontSize: 13, color: C.dark }}>{it.t}</Text>
            <Text style={{ fontSize: 12, color: C.darkSoft, fontWeight: '700' }}>× {it.qty}</Text>
          </View>
        ))}
      </View>

      {/* Location */}
      <View
        style={{
          marginTop: 12,
          padding: 10,
          borderRadius: 12,
          backgroundColor: C.beige,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <IconPin color={C.green} size={14} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.dark }} numberOfLines={1}>
            {r.fridgeName}
          </Text>
          <Text style={{ fontSize: 10, color: C.darkSoft }} numberOfLines={1}>
            {r.fridgeAddr}
          </Text>
        </View>
      </View>

      {/* Actions */}
      {!historical && onCancel ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <Pressable
            onPress={onCancel}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 999,
              borderWidth: 1.5,
              borderColor: '#c44',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#c44', fontWeight: '700', fontSize: 12 }}>Annuler</Text>
          </Pressable>
          {isReady ? (
            <View
              style={{
                flex: 2,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: C.orange,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              }}
            >
              <IconClock color={C.beige} />
              <Text style={{ color: C.beige, fontWeight: '700', fontSize: 12 }}>Rejoindre le frigo</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function statusLabel(s: ReturnType<typeof reservationStatus>): string {
  switch (s) {
    case 'pending':
      return 'RÉSERVÉ';
    case 'ready':
      return '● DISPO MAINTENANT';
    case 'past':
      return 'TERMINÉE';
    case 'cancelled':
      return 'ANNULÉE';
  }
}

const sectionTitle = {
  fontSize: 10,
  letterSpacing: 3,
  color: C.darkSoft,
  fontWeight: '700' as const,
  marginLeft: 20,
  marginTop: 20,
  marginBottom: 10,
};
