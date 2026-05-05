import React, { useMemo, useState } from 'react';
import FoodSearchModal from './FoodSearchModal';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { C, F, softShadow } from '../tokens';
import { IconBack } from '../shared/Icons';
import { hapticLight, hapticSelection } from '../shared/haptics';
import {
  useJournalStore,
  dayKey,
  entriesForDay,
  dayTotals,
  formatTime,
  formatDayLabel,
} from '../store/useJournalStore';
import { useUserStore, computeMacroTargets } from '../store/useUserStore';
import { useFavoritesStore, favoriteIdFromFood } from '../store/useFavoritesStore';
import type { HomeStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Journal'>;

function shiftDay(key: string, delta: number): string {
  const d = new Date(key);
  d.setDate(d.getDate() + delta);
  return dayKey(d.getTime());
}

export default function Journal() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<NativeStackScreenProps<HomeStackParamList, 'Journal'>['route']>();
  const insets = useSafeAreaInsets();

  const entries = useJournalStore((s) => s.entries);
  const removeEntry = useJournalStore((s) => s.removeEntry);
  const favorites = useFavoritesStore((s) => s.items);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);

  // Macro targets derived live from the user profile.
  // Select primitives + memoize — avoids the "getSnapshot should be cached" infinite-loop trap.
  const weightKg = useUserStore((s) => s.weightKg);
  const heightCm = useUserStore((s) => s.heightCm);
  const age = useUserStore((s) => s.age);
  const sex = useUserStore((s) => s.sex);
  const activityLevel = useUserStore((s) => s.activityLevel);
  const goal = useUserStore((s) => s.goal);
  const targets = useMemo(
    () => computeMacroTargets({ weightKg, heightCm, age, sex, activityLevel, goal }),
    [weightKg, heightCm, age, sex, activityLevel, goal]
  );

  const [selectedDay, setSelectedDay] = useState<string>(route.params?.dayKey ?? dayKey(Date.now()));
  const [searchOpen, setSearchOpen] = useState(false);
  const isToday = selectedDay === dayKey(Date.now());
  const isPast = new Date(selectedDay) < new Date(dayKey(Date.now()));

  const dayEntries = useMemo(() => entriesForDay(entries, selectedDay), [entries, selectedDay]);
  const totals = useMemo(() => dayTotals(dayEntries), [dayEntries]);

  const confirmRemove = (id: string, food: string) => {
    Alert.alert('Supprimer ?', `Retirer "${food}" du journal ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          hapticLight();
          removeEntry(id);
        },
      },
    ]);
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
          <Text style={{ fontSize: 11, letterSpacing: 3, color: C.green, fontWeight: '700' }}>MON JOURNAL</Text>
          <Text style={{ fontFamily: F.display, fontSize: 24, fontWeight: '900', color: C.dark, marginTop: 2 }}>
            {formatDayLabel(selectedDay)}
          </Text>
        </View>
      </View>

      {/* Day navigation */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, paddingBottom: 8 }}>
        <Pressable
          onPress={() => {
            hapticSelection();
            setSelectedDay((d) => shiftDay(d, -1));
          }}
          accessibilityLabel="Jour précédent"
          hitSlop={12}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', ...softShadow }}
        >
          <Svg width={14} height={14} viewBox="0 0 24 24">
            <Path d="M15 6l-6 6 6 6" stroke={C.dark} strokeWidth={2.5} strokeLinecap="round" fill="none" strokeLinejoin="round" />
          </Svg>
        </Pressable>
        <Pressable
          onPress={() => {
            hapticSelection();
            setSelectedDay(dayKey(Date.now()));
          }}
          disabled={isToday}
          style={{
            paddingVertical: 6,
            paddingHorizontal: 14,
            borderRadius: 999,
            backgroundColor: isToday ? C.beige3 : C.green,
            opacity: isToday ? 0.6 : 1,
          }}
        >
          <Text style={{ color: isToday ? C.green : C.beige, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
            {isToday ? 'AUJOURD’HUI' : 'RETOUR AU JOUR'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            hapticSelection();
            setSelectedDay((d) => shiftDay(d, 1));
          }}
          disabled={isToday}
          accessibilityLabel="Jour suivant"
          hitSlop={12}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: isToday ? C.beige3 : C.white,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isToday ? 0.5 : 1,
            ...softShadow,
          }}
        >
          <Svg width={14} height={14} viewBox="0 0 24 24">
            <Path d="M9 6l6 6-6 6" stroke={C.dark} strokeWidth={2.5} strokeLinecap="round" fill="none" strokeLinejoin="round" />
          </Svg>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
        {/* Totals card */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 8,
            backgroundColor: C.green,
            borderRadius: 24,
            padding: 20,
            overflow: 'hidden',
          }}
        >
          <View style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(237,126,0,0.18)' }} />
          <View style={{ position: 'absolute', left: -30, bottom: -50, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(190,211,92,0.12)' }} />

          <Text style={{ fontSize: 10, letterSpacing: 3, color: C.lime, fontWeight: '700' }}>TOTAL DU JOUR</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6, gap: 8 }}>
            <Text style={{ fontFamily: F.display, fontSize: 44, fontWeight: '900', color: C.beige }}>{Math.round(totals.kcal)}</Text>
            <Text style={{ fontSize: 16, color: C.lime, opacity: 0.8 }}>/ {targets.kcal} kcal</Text>
          </View>
          <Text style={{ fontSize: 12, color: C.lime, opacity: 0.75, marginTop: 2 }}>
            {dayEntries.length} entrée{dayEntries.length > 1 ? 's' : ''}
          </Text>

          <View style={{ marginTop: 18, gap: 10 }}>
            <MacroBar label="Protéines" value={totals.prot} target={targets.prot} unit="g" color={C.lime} />
            <MacroBar label="Glucides" value={totals.glu} target={targets.glu} unit="g" color={C.orange} />
            <MacroBar label="Lipides" value={totals.lip} target={targets.lip} unit="g" color={C.beige} />
          </View>
        </View>

        {/* Entries */}
        <Text style={{ marginLeft: 20, marginTop: 24, fontSize: 14, fontWeight: '700', color: C.dark }}>
          Timeline
        </Text>

        {dayEntries.length === 0 ? (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              padding: 28,
              borderRadius: 20,
              backgroundColor: C.white,
              borderWidth: 1,
              borderColor: C.beige2,
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 40 }}>🍽️</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: C.dark, textAlign: 'center' }}>
              {isPast ? 'Pas de repas ce jour-là' : 'Rien enregistré pour le moment'}
            </Text>
            <Text style={{ fontSize: 12, color: C.darkSoft, textAlign: 'center', lineHeight: 18, maxWidth: 280 }}>
              Cherche un aliment, scanne un code-barres ou prends une photo de ton plat.
            </Text>
            {isToday ? (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                <Pressable
                  onPress={() => {
                    hapticLight();
                    setSearchOpen(true);
                  }}
                  style={{ paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, backgroundColor: C.orange }}
                >
                  <Text style={{ color: C.beige, fontWeight: '700', fontSize: 13 }}>+ Ajouter un repas</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    hapticLight();
                    navigation.getParent()?.getParent()?.navigate('ScannerModal');
                  }}
                  style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5, borderColor: C.green }}
                >
                  <Text style={{ color: C.green, fontWeight: '700', fontSize: 13 }}>📷 Photo</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={{ marginHorizontal: 16, marginTop: 12, gap: 10 }}>
            {dayEntries.map((e) => {
              const favId = favoriteIdFromFood(e.food);
              const fav = favorites.some((f) => f.id === favId);
              return (
                <Pressable
                  key={e.id}
                  onLongPress={() => confirmRemove(e.id, e.food)}
                  delayLongPress={400}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    backgroundColor: C.white,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: C.beige2,
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: e.source === 'scan' ? 'rgba(237,126,0,0.15)' : 'rgba(190,211,92,0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{e.emoji}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: C.dark }} numberOfLines={1}>
                      {e.food}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      <Text style={{ fontSize: 11, color: C.darkSoft }}>{formatTime(e.timestamp)}</Text>
                      <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.darkSoft }} />
                      <Text
                        style={{
                          fontSize: 10,
                          color: e.source === 'scan' ? C.orange : C.green,
                          fontWeight: '700',
                          letterSpacing: 0.5,
                        }}
                      >
                        {e.source === 'scan' ? 'SCAN' : e.source === 'manual' ? 'AJOUT' : 'ACHAT'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: C.green }}>{Math.round(e.kcal)} kcal</Text>
                    <Text style={{ fontSize: 10, color: C.darkSoft, marginTop: 2 }}>
                      {Math.round(e.prot)}p · {Math.round(e.glu)}g · {Math.round(e.lip)}l
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      hapticLight();
                      toggleFavorite({
                        id: favId,
                        food: e.food,
                        emoji: e.emoji,
                        image: e.image,
                        kcal: e.kcal,
                        prot: e.prot,
                        glu: e.glu,
                        lip: e.lip,
                      });
                    }}
                    accessibilityLabel={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    hitSlop={10}
                    style={{ marginLeft: 6, padding: 4 }}
                  >
                    <Text style={{ fontSize: 18, color: fav ? C.orange : '#d8d2c8' }}>{fav ? '★' : '☆'}</Text>
                  </Pressable>
                </Pressable>
              );
            })}

            <Text style={{ textAlign: 'center', fontSize: 10, color: C.darkSoft, marginTop: 6 }}>
              Appui long pour supprimer · ★ pour mettre en favori
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      {isToday ? (
        <Pressable
          onPress={() => {
            hapticLight();
            setSearchOpen(true);
          }}
          accessibilityLabel="Ajouter un repas"
          style={({ pressed }) => ({
            position: 'absolute',
            right: 20,
            bottom: insets.bottom + 24,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: C.orange,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: C.orange,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.45,
            shadowRadius: 20,
            elevation: 10,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
        >
          <Text style={{ color: C.beige, fontSize: 28, fontWeight: '700', lineHeight: 30, marginTop: -2 }}>+</Text>
        </Pressable>
      ) : null}

      <FoodSearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} source="manual" />
    </View>
  );
}

function MacroBar({ label, value, target, unit, color }: { label: string; value: number; target: number; unit: string; color: string }) {
  const pct = Math.min(value / target, 1);
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 11, color: C.beige, opacity: 0.85, fontWeight: '600' }}>{label}</Text>
        <Text style={{ fontSize: 11, color: C.lime, opacity: 0.8 }}>
          {Math.round(value)} / {target} {unit}
        </Text>
      </View>
      <View style={{ height: 5, borderRadius: 3, backgroundColor: 'rgba(252,233,218,0.15)', overflow: 'hidden' }}>
        <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
      </View>
    </View>
  );
}
