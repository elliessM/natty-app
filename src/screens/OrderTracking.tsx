import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F, softShadow, cardShadow, withAlpha } from '../tokens';
import { IconBack, IconPin, IconClock } from '../shared/Icons';
import {
  useReservationsStore,
  reservationStatus,
  formatPickupTime,
  countdownLabel,
  type Reservation,
} from '../store/useReservationsStore';
import { formatPrice } from '../data/products';
import { hapticLight, hapticWarning } from '../shared/haptics';
import type { HomeStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'OrderTracking'>;
type Props = NativeStackScreenProps<HomeStackParamList, 'OrderTracking'>;

// Étapes affichées dans la timeline (de bas en haut visuellement, mais haut en bas)
type TimelineStep = {
  key: 'reserved' | 'preparing' | 'ready' | 'collected';
  label: string;
  body: string;
  emoji: string;
};

const STEPS: TimelineStep[] = [
  { key: 'reserved', label: 'Commande réservée', body: 'Ta réservation est confirmée.', emoji: '📝' },
  { key: 'preparing', label: 'En préparation', body: 'Le frigo prépare ton retrait.', emoji: '👨‍🍳' },
  { key: 'ready', label: 'Prête à récupérer', body: 'Présente-toi au frigo Natty.', emoji: '🟢' },
  { key: 'collected', label: 'Récupérée', body: 'Bon appétit !', emoji: '✅' },
];

const PREP_LEAD_MS = 30 * 60 * 1000; // passage en "préparation" 30 min avant le retrait

function currentStepIndex(r: Reservation, now: number): number {
  if (r.completedAt) return 3;
  if (r.cancelledAt) return 0;
  const status = reservationStatus(r, now);
  if (status === 'ready') return 2;
  if (status === 'past') return 3;
  // pending — distinguer "réservée" et "en préparation"
  if (r.pickupTimestamp - now <= PREP_LEAD_MS) return 1;
  return 0;
}

export default function OrderTracking({ route }: Props) {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const reservations = useReservationsStore((s) => s.reservations);
  const cancelReservation = useReservationsStore((s) => s.cancelReservation);
  const completeReservation = useReservationsStore((s) => s.completeReservation);
  const markAsPaid = useReservationsStore((s) => s.markAsPaid);

  const reservation = useMemo(
    () => reservations.find((r) => r.id === route.params.id) ?? null,
    [reservations, route.params.id]
  );

  // Tick chaque 30s pour recalculer le countdown / statut
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!reservation) {
    return (
      <View style={{ flex: 1, backgroundColor: C.beige, paddingTop: insets.top + 40, alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: C.darkSoft }}>Commande introuvable.</Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ marginTop: 20, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 999, backgroundColor: C.green }}
        >
          <Text style={{ color: C.beige, fontWeight: '700' }}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const status = reservationStatus(reservation, now);
  const stepIdx = currentStepIndex(reservation, now);
  const isReady = status === 'ready';
  const isCancelled = !!reservation.cancelledAt;
  const isPast = !!reservation.completedAt || (status === 'past' && !reservation.cancelledAt);

  const itemCount = reservation.items.reduce((sum, it) => sum + it.qty, 0);
  const isPaid = !!reservation.paidAt;

  const confirmMarkPaid = () => {
    Alert.alert('Confirmer le paiement ?', `Régler ${formatPrice(reservation.total)} € maintenant.`, [
      { text: 'Pas encore', style: 'cancel' },
      {
        text: 'Payer',
        onPress: () => {
          hapticLight();
          markAsPaid(reservation.id);
        },
      },
    ]);
  };

  const confirmCancel = () => {
    Alert.alert(
      'Annuler la commande ?',
      `${itemCount} article${itemCount > 1 ? 's' : ''} chez ${reservation.fridgeName}. Cette action est irréversible.`,
      [
        { text: 'Garder', style: 'cancel' },
        {
          text: 'Annuler',
          style: 'destructive',
          onPress: () => {
            hapticWarning();
            cancelReservation(reservation.id);
          },
        },
      ]
    );
  };

  const confirmCollected = () => {
    Alert.alert('Marquer comme récupérée ?', 'Confirme la récupération pour clore la commande.', [
      { text: 'Pas encore', style: 'cancel' },
      {
        text: 'Récupérée ✓',
        onPress: () => {
          hapticLight();
          completeReservation(reservation.id);
        },
      },
    ]);
  };

  const openMaps = () => {
    hapticLight();
    const q = encodeURIComponent(reservation.fridgeAddr || reservation.fridgeName);
    const url = `https://maps.apple.com/?q=${q}`;
    Linking.openURL(url).catch(() => {});
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
          <Text style={{ fontSize: 11, letterSpacing: 3, color: C.green, fontWeight: '700' }}>MA COMMANDE</Text>
          <Text style={{ fontFamily: F.display, fontSize: 22, fontWeight: '900', color: C.dark, marginTop: 2 }} numberOfLines={1}>
            {isCancelled ? 'Commande annulée' : isPast ? 'Commande récupérée' : isReady ? 'Prête à récupérer' : 'En cours'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
        {/* Bannière paiement bloquant (sécurité : ne devrait pas arriver, tout est payé à la commande) */}
        {!isPaid && !isCancelled && !isPast ? (
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 12,
              padding: 12,
              borderRadius: 14,
              backgroundColor: withAlpha(C.orange, 0.12),
              borderWidth: 1,
              borderColor: withAlpha(C.orange, 0.4),
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 22 }}>🔒</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.orange, letterSpacing: 0.5 }}>
                PAIEMENT REQUIS
              </Text>
              <Text style={{ fontSize: 11, color: C.darkSoft, marginTop: 2, lineHeight: 15 }}>
                Le frigo ne s'ouvrira pas tant que la commande n'est pas réglée.
              </Text>
            </View>
          </View>
        ) : null}

        {/* Hero status */}
        <View style={{ paddingHorizontal: 16 }}>
          <LinearGradient
            colors={
              isCancelled
                ? [C.mute, C.darkSoft]
                : isReady
                ? [C.orange, C.orangeSoft]
                : isPast
                ? [C.green, C.greenAlt]
                : [C.green, C.greenDeep]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 22, padding: 20, overflow: 'hidden' }}
          >
            <View style={{ position: 'absolute', right: -50, top: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: withAlpha(C.lime, 0.14) }} />
            <View style={{ position: 'absolute', left: -30, bottom: -50, width: 140, height: 140, borderRadius: 70, backgroundColor: withAlpha(C.orange, 0.12) }} />

            <Text style={{ fontSize: 10, letterSpacing: 2.5, color: C.lime, fontWeight: '700' }}>
              {isCancelled ? 'ANNULÉE' : isReady ? '● DISPO MAINTENANT' : isPast ? 'CLÔTURÉE' : 'RETRAIT PRÉVU'}
            </Text>
            <Text style={{ fontFamily: F.display, fontSize: 30, fontWeight: '900', color: C.beige, marginTop: 8, letterSpacing: -0.5 }}>
              {formatPickupTime(reservation.pickupTimestamp)}
            </Text>
            {!isCancelled && !isPast ? (
              <Text style={{ fontSize: 13, color: C.lime, opacity: 0.85, marginTop: 4 }}>
                {isReady ? 'Ton retrait t\'attend.' : countdownLabel(reservation.pickupTimestamp, now)}
              </Text>
            ) : null}

            {/* Mini résumé */}
            <View style={{ flexDirection: 'row', marginTop: 18, gap: 10 }}>
              <Mini label="ARTICLES" value={String(itemCount)} />
              <Mini label="TOTAL" value={`${formatPrice(reservation.total)} €`} />
              <Mini label="N°" value={`#${reservation.id.slice(-4).toUpperCase()}`} />
            </View>

            {/* Badge paiement */}
            <View
              style={{
                marginTop: 14,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: isPaid ? withAlpha(C.lime, 0.22) : withAlpha(C.orange, 0.22),
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Text style={{ fontSize: 14 }}>{isPaid ? '✓' : '🔒'}</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1, color: C.beige }}>
                {isPaid
                  ? `PAYÉ · ${formatPrice(reservation.total)} €`
                  : `À RÉGLER · ${formatPrice(reservation.total)} €`}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Timeline */}
        {!isCancelled ? (
          <View style={{ paddingHorizontal: 16, marginTop: 22 }}>
            <Text style={{ fontSize: 11, letterSpacing: 2, color: C.green, fontWeight: '700', marginLeft: 4 }}>
              SUIVI
            </Text>
            <View
              style={{
                marginTop: 10,
                backgroundColor: C.white,
                borderRadius: 18,
                padding: 16,
                borderWidth: 1,
                borderColor: C.beige2,
              }}
            >
              {STEPS.map((step, i) => {
                const passed = i < stepIdx;
                const current = i === stepIdx;
                const last = i === STEPS.length - 1;
                return (
                  <View key={step.key} style={{ flexDirection: 'row', gap: 12 }}>
                    {/* Rail */}
                    <View style={{ alignItems: 'center', width: 32 }}>
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: passed || current ? (current ? C.orange : C.green) : C.beige3,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: current ? 3 : 0,
                          borderColor: current ? withAlpha(C.orange, 0.25) : 'transparent',
                        }}
                      >
                        <Text style={{ fontSize: 12, color: C.beige, fontWeight: '700' }}>
                          {passed ? '✓' : current ? '●' : i + 1}
                        </Text>
                      </View>
                      {!last ? (
                        <View
                          style={{
                            width: 2,
                            flex: 1,
                            backgroundColor: passed ? C.green : C.beige3,
                            marginVertical: 2,
                          }}
                        />
                      ) : null}
                    </View>
                    {/* Content */}
                    <View style={{ flex: 1, paddingBottom: last ? 0 : 18 }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '700',
                          color: passed || current ? C.dark : C.darkSoft,
                        }}
                      >
                        {step.emoji} {step.label}
                      </Text>
                      <Text style={{ fontSize: 11, color: C.darkSoft, marginTop: 2, lineHeight: 15 }}>
                        {step.body}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Frigo */}
        <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
          <Text style={{ fontSize: 11, letterSpacing: 2, color: C.green, fontWeight: '700', marginLeft: 4 }}>
            POINT DE RETRAIT
          </Text>
          <Pressable
            onPress={openMaps}
            disabled={isCancelled || isPast}
            style={({ pressed }) => ({
              marginTop: 10,
              padding: 16,
              borderRadius: 18,
              backgroundColor: C.white,
              borderWidth: 1,
              borderColor: C.beige2,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              opacity: pressed ? 0.95 : 1,
              ...softShadow,
            })}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: withAlpha(C.green, 0.08),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconPin color={C.green} size={20} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: C.dark }} numberOfLines={1}>
                {reservation.fridgeName}
              </Text>
              <Text style={{ fontSize: 11, color: C.darkSoft, marginTop: 2 }} numberOfLines={2}>
                {reservation.fridgeAddr}
              </Text>
            </View>
            {!isCancelled && !isPast ? (
              <Text style={{ fontSize: 11, color: C.orange, fontWeight: '700' }}>OUVRIR ›</Text>
            ) : null}
          </Pressable>
        </View>

        {/* Articles */}
        <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
          <Text style={{ fontSize: 11, letterSpacing: 2, color: C.green, fontWeight: '700', marginLeft: 4 }}>
            DÉTAIL
          </Text>
          <View
            style={{
              marginTop: 10,
              backgroundColor: C.white,
              borderRadius: 18,
              padding: 14,
              borderWidth: 1,
              borderColor: C.beige2,
              gap: 10,
            }}
          >
            {reservation.items.map((it, i) => (
              <View key={it.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 22 }}>{it.e}</Text>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: C.dark }} numberOfLines={1}>
                    {it.t}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: C.darkSoft, fontWeight: '700' }}>× {it.qty}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: C.green, minWidth: 56, textAlign: 'right' }}>
                  {formatPrice(it.price * it.qty)} €
                </Text>
              </View>
            ))}
            <View style={{ height: 1, backgroundColor: C.beige2, marginVertical: 4 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.dark }}>Total</Text>
              <Text style={{ fontFamily: F.display, fontSize: 20, fontWeight: '900', color: C.green }}>
                {formatPrice(reservation.total)} €
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        {!isCancelled && !isPast ? (
          <View style={{ paddingHorizontal: 16, marginTop: 22, gap: 10 }}>
            {!isPaid ? (
              <Pressable
                onPress={confirmMarkPaid}
                style={{
                  paddingVertical: 14,
                  borderRadius: 999,
                  backgroundColor: C.green,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 14 }}>⚡</Text>
                <Text style={{ color: C.beige, fontWeight: '700', fontSize: 14 }}>
                  Payer maintenant · {formatPrice(reservation.total)} €
                </Text>
              </Pressable>
            ) : null}
            {isReady ? (
              <Pressable
                onPress={isPaid ? confirmCollected : confirmMarkPaid}
                style={{
                  paddingVertical: 14,
                  borderRadius: 999,
                  backgroundColor: isPaid ? C.orange : C.beige3,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: isPaid ? 1 : 0.6,
                }}
              >
                <Text style={{ fontSize: 14 }}>{isPaid ? '✓' : '🔒'}</Text>
                <Text style={{ color: isPaid ? C.beige : C.darkSoft, fontWeight: '700', fontSize: 14 }}>
                  {isPaid ? "J'ai récupéré ma commande" : 'Paiement requis pour débloquer'}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={confirmCancel}
              style={{
                paddingVertical: 12,
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: C.danger,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: C.danger, fontWeight: '700', fontSize: 13 }}>Annuler la commande</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Info footer */}
        <Text style={{ fontSize: 10, color: C.darkSoft, textAlign: 'center', marginTop: 20, paddingHorizontal: 32, lineHeight: 14 }}>
          Réservation passée le{' '}
          {new Date(reservation.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </Text>
      </ScrollView>
    </View>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: withAlpha(C.beige, 0.12),
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
      }}
    >
      <Text style={{ fontSize: 9, color: C.lime, opacity: 0.8, letterSpacing: 1.2, fontWeight: '700' }}>
        {label}
      </Text>
      <Text style={{ fontFamily: F.display, fontSize: 16, fontWeight: '900', color: C.beige, marginTop: 2 }}>
        {value}
      </Text>
    </View>
  );
}
