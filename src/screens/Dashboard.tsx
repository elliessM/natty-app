import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F, softShadow } from '../tokens';
import MacroRings from '../shared/MacroRings';
import { IconBell, IconPin, IconArrow } from '../shared/Icons';
import WaterGlass from '../shared/WaterGlass';
import { useSteps, STEPS_GOAL } from '../hooks/useSteps';
import { useStats } from '../hooks/useStats';
import BarChart7Days from '../shared/charts/BarChart7Days';
import CoachCard from '../shared/CoachCard';
import FadeInView from '../shared/FadeInView';
import { useUserStore, HYDRATION_STEP_ML, computeMacroTargets } from '../store/useUserStore';
import { useJournalStore, formatTime, dayKey, entriesForDay, dayTotals } from '../store/useJournalStore';
import {
  useReservationsStore,
  upcomingReservations,
  reservationStatus,
  formatPickupTime,
  countdownLabel,
} from '../store/useReservationsStore';
import { FRIDGES, distanceMeters, formatDistance, walkingTime } from '../data/fridges';
import { useLocation } from '../hooks/useLocation';
import { hapticLight, hapticSuccess } from '../shared/haptics';
import { MEAL_IMAGES } from '../data/images';
import SmartImage from '../shared/SmartImage';

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

function todayLabel() {
  const d = new Date();
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function entryRelativeLabel(ts: number): string {
  const now = new Date();
  const d = new Date(ts);
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const wasYesterday = d.toDateString() === yesterday.toDateString();
  if (sameDay) return `Aujourd'hui · ${formatTime(ts)}`;
  if (wasYesterday) return `Hier · ${formatTime(ts)}`;
  return `${DAYS[d.getDay()]} · ${formatTime(ts)}`;
}

export default function Dashboard() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const name = useUserStore((s) => s.name);
  const hydrationMl = useUserStore((s) => s.hydrationMl);
  const hydrationGoalMl = useUserStore((s) => s.hydrationGoalMl);
  const addHydration = useUserStore((s) => s.addHydration);
  const removeHydration = useUserStore((s) => s.removeHydration);
  const resetHydrationIfNewDay = useUserStore((s) => s.resetHydrationIfNewDay);

  // Macro targets from profile + today's totals from the journal → real "atteint %".
  // Select primitives then memoize the derived targets so the selector stays cached.
  const weightKg = useUserStore((s) => s.weightKg);
  const heightCm = useUserStore((s) => s.heightCm);
  const age = useUserStore((s) => s.age);
  const sex = useUserStore((s) => s.sex);
  const activityLevel = useUserStore((s) => s.activityLevel);
  const goal = useUserStore((s) => s.goal);
  const targets = React.useMemo(
    () => computeMacroTargets({ weightKg, heightCm, age, sex, activityLevel, goal }),
    [weightKg, heightCm, age, sex, activityLevel, goal]
  );
  const { steps, available: stepsAvailable } = useSteps();
  const stepsReached = steps >= STEPS_GOAL;
  const stepsFormatted = `${steps.toLocaleString('fr-FR')} pas`;

  const entries = useJournalStore((s) => s.entries);
  const todayTotals = React.useMemo(
    () => dayTotals(entriesForDay(entries, dayKey(Date.now()))),
    [entries]
  );

  const kcalNow = Math.round(todayTotals.kcal);
  const protNow = Math.round(todayTotals.prot);
  const gluNow = Math.round(todayTotals.glu);
  const lipNow = Math.round(todayTotals.lip);
  const pctKcal = targets.kcal > 0 ? Math.min(kcalNow / targets.kcal, 1) : 0;
  const pctProt = targets.prot > 0 ? Math.min(protNow / targets.prot, 1) : 0;
  const pctGlu = targets.glu > 0 ? Math.min(gluNow / targets.glu, 1) : 0;

  React.useEffect(() => {
    resetHydrationIfNewDay();
  }, []);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Phase 3 : remplacer par un vrai fetch des macros / meals / frigos
    setTimeout(() => {
      hapticLight();
      setRefreshing(false);
    }, 800);
  }, []);

  const handleAddHydration = () => {
    const nextMl = hydrationMl + HYDRATION_STEP_ML;
    if (nextMl >= hydrationGoalMl && hydrationMl < hydrationGoalMl) {
      hapticSuccess(); // celebrate reaching the goal
    } else {
      hapticLight();
    }
    addHydration();
  };

  const handleRemoveHydration = () => {
    if (hydrationMl <= 0) return;
    hapticLight();
    removeHydration();
  };

  // Format litres FR avec max 2 décimales, sans zéros traînants → "0,25" / "1" / "1,5"
  const formatL = (ml: number) =>
    (ml / 1000).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const hydrationL = formatL(hydrationMl);
  const hydrationTargetL = formatL(hydrationGoalMl);
  const hydrationPct = Math.min(hydrationMl / hydrationGoalMl, 1);
  const hydrationReached = hydrationMl >= hydrationGoalMl;

  const { coords } = useLocation();
  const closestFridge = React.useMemo(() => {
    const openFridges = FRIDGES.filter((f) => f.open);
    if (openFridges.length === 0) return null;
    return openFridges
      .map((f) => ({ ...f, _d: distanceMeters(coords, { lat: f.lat, lng: f.lng }) }))
      .sort((a, b) => a._d - b._d)[0];
  }, [coords]);

  const journalEntries = useJournalStore((s) => s.entries);
  const recentEntries = React.useMemo(
    () => [...journalEntries].sort((a, b) => b.timestamp - a.timestamp).slice(0, 3),
    [journalEntries]
  );

  const reservations = useReservationsStore((s) => s.reservations);
  const nextReservation = React.useMemo(() => upcomingReservations(reservations)[0] ?? null, [reservations]);

  const stats7 = useStats(7);

  return (
    <View style={{ flex: 1, backgroundColor: C.beige }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.orange} colors={[C.orange]} />}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: insets.top + 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              onPress={() => navigation.navigate('Profile')}
              accessibilityLabel="Ouvrir mon profil"
              hitSlop={8}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: C.green,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text
                style={{
                  color: C.beige,
                  fontWeight: '700',
                  fontSize: 18,
                  fontFamily: F.display,
                  lineHeight: 18,
                  textAlign: 'center',
                  includeFontPadding: false,
                  textAlignVertical: 'center',
                }}
              >
                {name[0]?.toUpperCase()}
              </Text>
            </Pressable>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: C.dark }}>Hello {name} 👋</Text>
              <Text style={{ fontSize: 11, color: C.darkSoft, marginTop: 3 }}>{todayLabel()} · Post-training</Text>
            </View>
          </View>
          <Pressable
            accessibilityLabel="Notifications"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: C.white,
              alignItems: 'center',
              justifyContent: 'center',
              ...softShadow,
            }}
          >
            <IconBell color={C.dark} />
            <View
              style={{
                position: 'absolute',
                right: 10,
                top: 10,
                width: 9,
                height: 9,
                borderRadius: 4.5,
                backgroundColor: C.orange,
                borderWidth: 2,
                borderColor: '#fff',
              }}
            />
          </Pressable>
        </View>

        {/* Hero macro card */}
        <FadeInView delay={50}>
        <View
          style={{
            marginTop: 18,
            marginHorizontal: 16,
            borderRadius: 28,
            backgroundColor: C.green,
            overflow: 'hidden',
            padding: 18,
          }}
        >
          <View style={{ position: 'absolute', right: -60, top: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(190,211,92,0.14)' }} />
          <View style={{ position: 'absolute', left: -60, bottom: -60, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(237,126,0,0.16)' }} />
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={{ width: 150, height: 150, flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
              <MacroRings
                size={150}
                values={[Math.round(pctKcal * 100), Math.round(pctProt * 100), Math.round(pctGlu * 100)]}
              />
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                pointerEvents="none"
              >
                <Text style={{ fontFamily: F.display, fontSize: 30, fontWeight: '900', color: C.beige, lineHeight: 32 }}>
                  {Math.round(pctKcal * 100)}%
                </Text>
                <Text style={{ fontSize: 8, letterSpacing: 1.5, color: C.lime, fontWeight: '700', marginTop: 2, opacity: 0.85 }}>
                  ATTEINT
                </Text>
              </View>
            </View>
            <View style={{ flex: 1, paddingTop: 4, gap: 12 }}>
              {[
                { c: C.orange, l: 'Calories', v: `${kcalNow} / ${targets.kcal}` },
                { c: C.lime, l: 'Protéines', v: `${protNow} / ${targets.prot} g` },
                { c: C.beige, l: 'Glucides', v: `${gluNow} / ${targets.glu} g` },
              ].map((r, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: r.c }} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: C.beige }} numberOfLines={1}>
                      {r.l}
                    </Text>
                    <Text style={{ fontSize: 12, color: C.lime, opacity: 0.85, marginTop: 2 }} numberOfLines={1}>
                      {r.v}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        </FadeInView>

        {/* Next reservation — remontée au top pour être super visible */}
        {nextReservation ? (
          <FadeInView delay={100}>
            <Pressable
              onPress={() => navigation.navigate('OrderTracking', { id: nextReservation.id })}
              style={({ pressed }) => ({
                marginTop: 14,
                marginHorizontal: 16,
                padding: 16,
                borderRadius: 20,
                backgroundColor: reservationStatus(nextReservation) === 'ready' ? C.orange : C.green,
                overflow: 'hidden',
                opacity: pressed ? 0.9 : 1,
                shadowColor: reservationStatus(nextReservation) === 'ready' ? C.orange : C.green,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 18,
                elevation: 6,
              })}
            >
              <View style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(190,211,92,0.15)' }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 28 }}>🕒</Text>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 10, letterSpacing: 2, color: C.lime, fontWeight: '700' }}>
                    {reservationStatus(nextReservation) === 'ready' ? '● DISPO MAINTENANT' : 'PROCHAINE COMMANDE'}
                  </Text>
                  <Text style={{ fontSize: 16, fontFamily: F.display, fontWeight: '900', color: C.beige, marginTop: 4 }} numberOfLines={1}>
                    {formatPickupTime(nextReservation.pickupTimestamp)}
                  </Text>
                  <Text style={{ fontSize: 11, color: C.lime, opacity: 0.85, marginTop: 2 }} numberOfLines={1}>
                    {nextReservation.fridgeName} · {nextReservation.items.length} article
                    {nextReservation.items.length > 1 ? 's' : ''} ·{' '}
                    {reservationStatus(nextReservation) === 'pending'
                      ? countdownLabel(nextReservation.pickupTimestamp)
                      : 'à récupérer'}
                  </Text>
                </View>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(252,233,218,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: C.beige, fontWeight: '700', fontSize: 18 }}>→</Text>
                </View>
              </View>
            </Pressable>
          </FadeInView>
        ) : null}

        {/* Steps / hydration */}
        <FadeInView delay={150}>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12, marginHorizontal: 16 }}>
          <View style={[statBox, { borderColor: stepsReached ? C.lime : C.beige2, borderWidth: stepsReached ? 1.5 : 1 }]}>
            <View style={statIcon('rgba(237,126,0,0.18)')}>
              <Text style={{ fontSize: 16 }}>👟</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontWeight: '700', fontSize: 14, color: C.dark }} numberOfLines={1}>
                {stepsAvailable ? stepsFormatted : '— · —'}
              </Text>
              <Text style={{ fontSize: 10, color: C.darkSoft, marginTop: 1 }} numberOfLines={1}>
                {stepsAvailable ? `sur ${STEPS_GOAL.toLocaleString('fr-FR')} pas` : 'Capteur indispo'}
              </Text>
            </View>
          </View>
          <View
            style={[
              statBox,
              {
                justifyContent: 'space-between',
                paddingRight: 6,
                borderColor: hydrationReached ? C.lime : C.beige2,
                borderWidth: hydrationReached ? 1.5 : 1,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              <WaterGlass pct={hydrationPct} size={32} reached={hydrationReached} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontWeight: '700', fontSize: 13, color: C.dark }} numberOfLines={1}>
                  {hydrationL} / {hydrationTargetL} L
                </Text>
                <Text style={{ fontSize: 10, color: C.darkSoft, marginTop: 1 }} numberOfLines={1}>
                  {hydrationReached ? 'Objectif 🎉' : `${HYDRATION_STEP_ML} mL`}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 4, flexShrink: 0 }}>
              <Pressable
                onPress={handleRemoveHydration}
                disabled={hydrationMl <= 0}
                accessibilityLabel="Retirer 250 mL"
                hitSlop={6}
                style={({ pressed }) => ({
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: hydrationMl <= 0 ? C.beige3 : C.beige,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.7 : hydrationMl <= 0 ? 0.5 : 1,
                  borderWidth: 1,
                  borderColor: 'rgba(0,65,47,0.12)',
                })}
              >
                <Text style={{ color: C.dark, fontWeight: '700', fontSize: 16, lineHeight: 18, includeFontPadding: false }}>−</Text>
              </Pressable>
              <Pressable
                onPress={handleAddHydration}
                accessibilityLabel="Ajouter 250 mL"
                hitSlop={6}
                style={({ pressed }) => ({
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: hydrationReached ? C.lime : C.orange,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ color: hydrationReached ? C.green : C.white, fontWeight: '700', fontSize: 16, lineHeight: 18, includeFontPadding: false }}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Hydration progress bar */}
        <View style={{ marginHorizontal: 16, marginTop: 8, height: 4, borderRadius: 2, backgroundColor: C.beige2, overflow: 'hidden' }}>
          <View style={{ width: `${hydrationPct * 100}%`, height: '100%', backgroundColor: hydrationReached ? C.lime : C.orange, borderRadius: 2 }} />
        </View>
        </FadeInView>

        {/* Next fridge card */}
        <FadeInView delay={250}>
        <Pressable
          accessibilityLabel="Ouvrir la carte des frigos"
          onPress={() => navigation.getParent()?.navigate('MapTab', { screen: 'SmartMap' })}
          style={({ pressed }) => ({
            marginTop: 14,
            marginHorizontal: 16,
            borderRadius: 20,
            backgroundColor: C.white,
            borderWidth: 1,
            borderColor: C.beige2,
            paddingVertical: 14,
            paddingHorizontal: 14,
            flexDirection: 'row',
            gap: 12,
            alignItems: 'center',
            opacity: pressed ? 0.88 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <LinearGradient
            colors={[C.green, C.greenAlt]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <IconPin color={C.lime} size={26} />
          </LinearGradient>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 9, letterSpacing: 1, color: C.orange, fontWeight: '700' }}>FRIGO LE PLUS PROCHE</Text>
              {closestFridge ? (
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.lime }} />
              ) : null}
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.dark, marginTop: 4 }} numberOfLines={1}>
              {closestFridge?.name ?? 'Aucun frigo ouvert'}
            </Text>
            {closestFridge ? (
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: C.dark }}>{formatDistance(closestFridge._d)}</Text>
                <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.dark }} />
                <Text style={{ fontSize: 12, fontWeight: '500', color: C.dark }}>{walkingTime(closestFridge._d)} à pied</Text>
              </View>
            ) : null}
          </View>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: C.orange,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              shadowColor: C.orange,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              elevation: 4,
            }}
          >
            <IconArrow />
          </View>
        </Pressable>
        </FadeInView>

        {/* Coach Natty */}
        <FadeInView delay={350}>
          <CoachCard />
        </FadeInView>

        {/* Stats preview */}
        {stats7.daysLogged > 0 ? (
          <Pressable
            onPress={() => navigation.navigate('Stats')}
            style={({ pressed }) => ({
              marginTop: 16,
              marginHorizontal: 16,
              padding: 16,
              borderRadius: 20,
              backgroundColor: C.white,
              borderWidth: 1,
              borderColor: C.beige2,
              opacity: pressed ? 0.92 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <View>
                <Text style={{ fontSize: 10, letterSpacing: 2, color: C.green, fontWeight: '700' }}>MES STATS · 7 JOURS</Text>
                <Text style={{ fontFamily: F.display, fontSize: 22, fontWeight: '900', color: C.dark, marginTop: 4 }}>
                  {stats7.averages.kcal} kcal/j en moyenne
                </Text>
                <Text style={{ fontSize: 11, color: C.darkSoft, marginTop: 2 }}>
                  {stats7.daysLogged}/7 jours loggés · Voir tout →
                </Text>
              </View>
            </View>
            <View style={{ marginTop: 12 }}>
              <BarChart7Days data={stats7.bars} goal={targets.kcal} height={110} showLabels showValues={false} />
            </View>
          </Pressable>
        ) : null}

        {/* Journal preview */}
        <View
          style={{
            marginTop: 24,
            paddingHorizontal: 20,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: C.dark }}>Mon journal</Text>
          <Pressable onPress={() => navigation.navigate('Journal')} hitSlop={8}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: C.green }}>Voir tout →</Text>
          </Pressable>
        </View>

        {recentEntries.length === 0 ? (
          <Pressable
            onPress={() => {
              hapticLight();
              navigation.getParent()?.getParent()?.navigate('ScannerModal');
            }}
            style={({ pressed }) => ({
              marginTop: 10,
              marginHorizontal: 16,
              padding: 20,
              borderRadius: 18,
              backgroundColor: C.white,
              borderWidth: 1,
              borderColor: C.beige2,
              alignItems: 'center',
              gap: 8,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontSize: 34 }}>🍽️</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: C.dark }}>Ton journal est vide</Text>
            <Text style={{ fontSize: 11, color: C.darkSoft, textAlign: 'center', lineHeight: 16 }}>
              Scanne ton premier repas ou commande dans un frigo Natty — tout apparaîtra ici.
            </Text>
            <View style={{ marginTop: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: C.orange }}>
              <Text style={{ color: C.beige, fontWeight: '700', fontSize: 12 }}>Scanner un repas</Text>
            </View>
          </Pressable>
        ) : (
          <View style={{ marginTop: 10, marginHorizontal: 16, gap: 8 }}>
            {recentEntries.map((e) => (
              <Pressable
                key={e.id}
                onPress={() => navigation.navigate('Journal')}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  backgroundColor: C.white,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: C.beige2,
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <SmartImage
                  source={MEAL_IMAGES[e.food]}
                  fallbackEmoji={e.emoji}
                  emojiSize={20}
                  bgColor={e.source === 'scan' ? 'rgba(237,126,0,0.15)' : 'rgba(190,211,92,0.2)'}
                  style={{ width: 44, height: 44, borderRadius: 12 }}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: C.dark }} numberOfLines={1}>
                    {e.food}
                  </Text>
                  <Text style={{ fontSize: 11, color: C.darkSoft, marginTop: 1 }}>{entryRelativeLabel(e.timestamp)}</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: C.green }}>{Math.round(e.kcal)} kcal</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Le bouton + a été retiré — toute saisie passe par l'onglet Scan central */}
    </View>
  );
}

const statBox = {
  flex: 1,
  height: 60,
  borderRadius: 18,
  backgroundColor: C.white,
  borderWidth: 1,
  borderColor: C.beige2,
  padding: 12,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
} as const;

const statIcon = (bg: string) =>
  ({
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: bg,
    alignItems: 'center',
    justifyContent: 'center',
  } as const);
