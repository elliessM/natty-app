import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Animated, Easing, PanResponder } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import { C, F, softShadow, withAlpha } from '../tokens';
import { IconSearch, IconFilter, IconPin, IconClock, IconBox, IconRecenter } from '../shared/Icons';
import { FRIDGES, distanceMeters, formatDistance, walkingTime } from '../data/fridges';
import { useLocation } from '../hooks/useLocation';
import { hapticSelection } from '../shared/haptics';
import type { MapStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<MapStackParamList, 'SmartMap'>;

// Screen-space positions for the mock map pins (first three fridges).
const PIN_POS = [
  { x: 124, y: 248, size: 44 },
  { x: 242, y: 296, size: 36 },
  { x: 332, y: 114, size: 36 },
];

// Seule « Ouvert » est fonctionnelle — les autres sont décoratives (pas encore de données produit par frigo).
const DECORATIVE_FILTERS = ['< 5 min', 'Protéines', 'Repas'];

const chipStyle = (on: boolean) =>
  ({
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: on ? C.green : C.white,
    borderWidth: on ? 0 : 1,
    borderColor: withAlpha(C.green, 0.2),
  }) as const;

const chipTextStyle = (on: boolean) =>
  ({
    color: on ? C.beige : C.dark,
    fontSize: 10,
    fontWeight: on ? ('700' as const) : ('500' as const),
  }) as const;

function FilterChips({ openOnly, onToggleOpen }: { openOnly: boolean; onToggleOpen: () => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Pressable
        onPress={() => {
          hapticSelection();
          onToggleOpen();
        }}
        accessibilityRole="button"
        accessibilityState={{ selected: openOnly }}
        style={chipStyle(openOnly)}
      >
        <Text style={chipTextStyle(openOnly)}>Ouvert</Text>
      </Pressable>
      {DECORATIVE_FILTERS.map((t) => (
        <View key={t} style={chipStyle(false)}>
          <Text style={chipTextStyle(false)}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

const SEED: [number, number, number, number][] = [
  [0, 60, 240, 10],
  [0, 150, 390, 8],
  [0, 240, 390, 10],
  [0, 340, 390, 8],
  [0, 420, 390, 10],
  [140, 0, 10, 490],
  [230, 0, 8, 490],
  [310, 0, 10, 490],
  [70, 0, 8, 490],
];

function MapTiles() {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 360, backgroundColor: '#e8ece3' }}>
      <View style={{ position: 'absolute', left: 20, top: 130, width: 90, height: 80, backgroundColor: '#c8d9b8', borderRadius: 12, opacity: 0.8 }} />
      <View style={{ position: 'absolute', left: 260, top: 350, width: 120, height: 60, backgroundColor: '#c8d9b8', borderRadius: 12, opacity: 0.8 }} />
      <View style={{ position: 'absolute', left: -10, top: 380, width: 180, height: 120, backgroundColor: '#cfe0ec', borderRadius: 90, opacity: 0.7 }} />
      {SEED.map((s, i) => (
        <View key={i} style={{ position: 'absolute', left: s[0], top: s[1], width: s[2], height: s[3], backgroundColor: '#fff', opacity: 0.95 }} />
      ))}
      {Array.from({ length: 10 }).map((_, i) => {
        const x = (i * 53 + 23) % 360;
        const y = (i * 79 + 40) % 420;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: 40 + ((i * 13) % 30),
              height: 28 + ((i * 17) % 20),
              backgroundColor: '#e0e4d8',
              borderRadius: 4,
              opacity: 0.7,
            }}
          />
        );
      })}
    </View>
  );
}

type FridgeItem = (typeof FRIDGES)[number] & { dist: number; distLabel: string; timeLabel: string };

function FridgeCard({ f, isSel, onPress, bg }: { f: FridgeItem; isSel: boolean; onPress: () => void; bg: string }) {
  const disabled = !f.open;
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        borderRadius: 16,
        backgroundColor: isSel ? '#e8f2ec' : bg,
        borderWidth: isSel ? 1.5 : 0,
        borderColor: C.green,
        paddingVertical: 12,
        paddingHorizontal: 14,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: disabled ? C.mute : C.dark }}>{f.name}</Text>
          <Text style={{ fontSize: 11, color: disabled ? C.mute : C.darkSoft, marginTop: 2 }}>{f.addr}</Text>
        </View>
        <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: f.open ? '#d4edda' : '#fde8e8' }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: f.open ? C.green : C.danger }}>
            {f.open ? '● Ouvert' : '● Fermé'}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <IconPin color={disabled ? C.mute : C.green} size={10} />
          <Text style={{ fontSize: 11, color: disabled ? C.mute : C.green }}>{f.distLabel}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <IconClock color={disabled ? C.mute : C.green} />
          <Text style={{ fontSize: 11, color: disabled ? C.mute : C.green }}>{f.timeLabel}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <IconBox color={disabled ? C.mute : C.orange} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: disabled ? C.mute : C.orange }}>
            {f.stockCount > 0 ? `${f.stockCount} produits` : 'Aucun produit'}
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        {f.open ? (
          isSel ? (
            <View style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, backgroundColor: C.green }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: C.beige }}>Commander →</Text>
            </View>
          ) : (
            <View style={{ paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5, borderColor: C.green }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: C.green }}>Voir stock</Text>
            </View>
          )
        ) : null}
      </View>
    </Pressable>
  );
}

function ViewToggle({ view, onChange }: { view: 'list' | 'map'; onChange: (v: 'list' | 'map') => void }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: C.white, borderRadius: 999, padding: 3, ...softShadow }}>
      {(
        [
          { v: 'list', label: 'Liste' },
          { v: 'map', label: 'Carte' },
        ] as const
      ).map(({ v, label }) => {
        const active = view === v;
        return (
          <Pressable
            key={v}
            onPress={() => {
              if (!active) {
                hapticSelection();
                onChange(v);
              }
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: active ? C.green : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: active ? C.beige : C.darkSoft }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SmartMap() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const searchTop = insets.top + 8;
  const toggleTop = searchTop + 62;
  const filtersTop = toggleTop + 52;
  const { coords, granted } = useLocation();

  const [view, setView] = useState<'list' | 'map'>('list');
  const [openOnly, setOpenOnly] = useState(false);

  // Bottom sheet draggable : 2 snap points (replié / déployé) + drag fluide.
  const COLLAPSED_TOP = 506;
  const EXPANDED_TOP = filtersTop + 60;
  const sheetTop = useRef(new Animated.Value(COLLAPSED_TOP)).current;
  const currentTopRef = useRef(COLLAPSED_TOP);

  useEffect(() => {
    const id = sheetTop.addListener(({ value }) => {
      currentTopRef.current = value;
    });
    return () => sheetTop.removeListener(id);
  }, [sheetTop]);

  const snapTo = (target: number) => {
    Animated.spring(sheetTop, {
      toValue: target,
      useNativeDriver: false,
      tension: 80,
      friction: 14,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 3,
      onPanResponderGrant: () => {
        sheetTop.stopAnimation();
        // Capture la valeur actuelle comme offset pour pouvoir suivre le doigt.
        sheetTop.extractOffset();
      },
      onPanResponderMove: (_, g) => {
        // Borne le drag entre EXPANDED_TOP et COLLAPSED_TOP
        const start = currentTopRef.current;
        const dy = g.dy;
        const next = Math.max(EXPANDED_TOP, Math.min(COLLAPSED_TOP, start + dy));
        sheetTop.setValue(next - start);
      },
      onPanResponderRelease: (_, g) => {
        sheetTop.flattenOffset();
        const finalTop = currentTopRef.current;
        const distExp = Math.abs(finalTop - EXPANDED_TOP);
        const distCol = Math.abs(finalTop - COLLAPSED_TOP);
        // Snap à la position la plus proche, biais vélocité (geste rapide).
        const target =
          g.vy < -0.5 ? EXPANDED_TOP : g.vy > 0.5 ? COLLAPSED_TOP : distExp < distCol ? EXPANDED_TOP : COLLAPSED_TOP;
        snapTo(target);
      },
      onPanResponderTerminate: () => {
        sheetTop.flattenOffset();
        snapTo(COLLAPSED_TOP);
      },
    })
  ).current;

  const togglePosition = () => {
    snapTo(currentTopRef.current > (EXPANDED_TOP + COLLAPSED_TOP) / 2 ? EXPANDED_TOP : COLLAPSED_TOP);
  };

  const sortedFridges = useMemo(() => {
    return FRIDGES.map((f) => {
      const dist = distanceMeters(coords, { lat: f.lat, lng: f.lng });
      return {
        ...f,
        dist,
        distLabel: formatDistance(dist),
        timeLabel: walkingTime(dist),
      };
    }).sort((a, b) => a.dist - b.dist);
  }, [coords]);

  const closestOpen = sortedFridges.find((f) => f.open);
  const listFridges = openOnly ? sortedFridges.filter((f) => f.open) : sortedFridges;
  const openCount = sortedFridges.filter((f) => f.open).length;

  // ─── Vue Liste (par défaut) ───────────────────────────────────────
  if (view === 'list') {
    return (
      <View style={{ flex: 1, backgroundColor: C.beige }}>
        <View style={{ paddingTop: searchTop, paddingHorizontal: 16, gap: 12 }}>
          <View
            style={{
              height: 48,
              borderRadius: 24,
              backgroundColor: C.white,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              gap: 10,
              ...softShadow,
            }}
          >
            <IconSearch />
            <Text style={{ flex: 1, fontSize: 13, color: C.mute }}>Trouver un Natty Fridge...</Text>
            <IconFilter />
          </View>
          <ViewToggle view={view} onChange={setView} />
          <FilterChips openOnly={openOnly} onToggleOpen={() => setOpenOnly((v) => !v)} />
          <View
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 999,
              backgroundColor: withAlpha(C.green, 0.85),
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              alignSelf: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 10 }}>🚧</Text>
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.lime, letterSpacing: 1 }}>PREVIEW · 1ER FRIGO FIN 2026</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 20, marginTop: 18 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: C.dark }}>Frigos Natty proches</Text>
          <Text style={{ fontSize: 10, color: C.green, fontWeight: '500' }}>{openCount} disponibles</Text>
        </View>
        <Text style={{ paddingHorizontal: 20, marginTop: 2, fontSize: 11, color: C.mute }}>
          {granted ? 'Trié par distance' : 'Position indisponible · distances relatives'}
        </Text>

        <ScrollView
          style={{ marginTop: 10 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {listFridges.map((f) => (
            <FridgeCard
              key={f.id}
              f={f}
              isSel={f.id === closestOpen?.id}
              onPress={() => navigation.navigate('AchatS1')}
              bg={C.white}
            />
          ))}
          {listFridges.length === 0 ? (
            <Text style={{ textAlign: 'center', fontSize: 12, color: C.mute, marginTop: 30 }}>
              Aucun frigo ouvert pour le moment.
            </Text>
          ) : null}
        </ScrollView>
      </View>
    );
  }

  // ─── Vue Carte ────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#edf0ea', overflow: 'hidden' }}>
      <MapTiles />

      <Svg width={390} height={490} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Path d="M 146 270 Q 200 260 242 298" stroke={C.orange} strokeWidth={3} strokeDasharray="6 6" fill="none" opacity={0.6} />
      </Svg>

      <View
        style={{
          position: 'absolute',
          left: 16,
          top: searchTop,
          right: 16,
          height: 48,
          borderRadius: 24,
          backgroundColor: C.white,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          gap: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 14,
          elevation: 3,
        }}
      >
        <IconSearch />
        <Text style={{ flex: 1, fontSize: 13, color: C.mute }}>Trouver un Natty Fridge...</Text>
        <IconFilter />
      </View>
      {/* Preview banner — mention claire pour la démo, sans casser le parcours */}
      <View
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          top: filtersTop + 44,
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 999,
          backgroundColor: withAlpha(C.green, 0.85),
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          alignSelf: 'flex-start',
          zIndex: 5,
        }}
      >
        <Text style={{ fontSize: 10 }}>🚧</Text>
        <Text style={{ fontSize: 10, fontWeight: '700', color: C.lime, letterSpacing: 1 }}>PREVIEW · 1ER FRIGO FIN 2026</Text>
      </View>

      <View style={{ position: 'absolute', left: 16, right: 16, top: toggleTop }}>
        <ViewToggle view={view} onChange={setView} />
      </View>

      <View style={{ position: 'absolute', left: 16, top: filtersTop }}>
        <FilterChips openOnly={openOnly} onToggleOpen={() => setOpenOnly((v) => !v)} />
      </View>

      {PIN_POS.map((p, i) => {
        const fridge = sortedFridges[i];
        if (!fridge) return null;
        const isSel = fridge.id === closestOpen?.id;
        const color = !fridge.open ? C.mute : isSel ? C.orange : C.green;
        return (
          <View key={fridge.id} style={{ position: 'absolute', left: p.x, top: p.y }}>
            {isSel ? (
              <View
                style={{
                  position: 'absolute',
                  left: -40,
                  top: -58,
                  width: 124,
                  height: 40,
                  backgroundColor: C.white,
                  borderRadius: 10,
                  padding: 6,
                  paddingHorizontal: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: C.dark }} numberOfLines={1}>
                  {fridge.name.split(' ').slice(0, 2).join(' ')}
                </Text>
                <Text style={{ fontSize: 9, color: C.green, marginTop: 1 }}>
                  {fridge.distLabel} · {fridge.stockCount} produits
                </Text>
              </View>
            ) : null}
            <View
              style={{
                width: p.size,
                height: p.size,
                borderRadius: 12,
                backgroundColor: color,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: isSel ? C.orange : '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: isSel ? 0.4 : 0.15,
                shadowRadius: 16,
                elevation: 5,
              }}
            >
              <Text style={{ fontFamily: F.display, fontWeight: '900', fontSize: p.size > 40 ? 20 : 16, color: C.beige }}>N</Text>
            </View>
          </View>
        );
      })}

      <View
        style={{
          position: 'absolute',
          right: 20,
          top: 460,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: C.white,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        <IconRecenter />
      </View>

      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          top: sheetTop,
          backgroundColor: C.white,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 6,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 6,
        }}
      >
        {/* Zone de drag — la handle + son enveloppe captent le pan */}
        <View {...panResponder.panHandlers}>
          <Pressable
            onPress={togglePosition}
            accessibilityLabel="Agrandir ou réduire la liste"
            hitSlop={10}
            style={{ paddingVertical: 10, alignItems: 'center' }}
          >
            <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: '#cfc7bd' }} />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, paddingHorizontal: 20, paddingBottom: 4 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: C.dark }}>Frigos Natty proches</Text>
          <Text style={{ fontSize: 10, color: C.green, fontWeight: '500' }}>
            {sortedFridges.filter((f) => f.open).length} disponibles
          </Text>
        </View>
        <Text style={{ paddingHorizontal: 20, paddingBottom: 6, fontSize: 11, color: C.mute }}>
          {granted ? 'Trié par distance' : 'Position indisponible · distances relatives'}
        </Text>
        <ScrollView style={{ paddingHorizontal: 14 }} contentContainerStyle={{ gap: 10, paddingBottom: 120 }}>
          {listFridges.map((f) => (
            <FridgeCard
              key={f.id}
              f={f}
              isSel={f.id === closestOpen?.id}
              onPress={() => navigation.navigate('AchatS1')}
              bg="#f4f4f4"
            />
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
