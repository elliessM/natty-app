import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { C, F, softShadow } from '../tokens';
import { IconBack, IconSearch } from '../shared/Icons';
import { searchFoods, getFoodByBarcode, type FoodHit } from '../api/foods';
import { hapticLight, hapticSelection, hapticSuccess, hapticWarning } from '../shared/haptics';
import PortionPickerSheet from '../shared/PortionPickerSheet';
import { useJournalStore, type JournalSource } from '../store/useJournalStore';
import { useFavoritesStore, favoriteIdFromFood, type FavoriteItem } from '../store/useFavoritesStore';
import { guessEmoji, macrosForPortion } from '../api/foods';

type Props = {
  visible: boolean;
  onClose: () => void;
  source?: JournalSource;
};

export default function FoodSearchModal({ visible, onClose, source = 'manual' }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FoodHit | null>(null);
  const [scanMode, setScanMode] = useState(false);
  const [scannedCodes, setScannedCodes] = useState<Set<string>>(new Set());
  const [permission, requestPermission] = useCameraPermissions();
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addEntry = useJournalStore((s) => s.addEntry);
  const journalEntries = useJournalStore((s) => s.entries);
  const favorites = useFavoritesStore((s) => s.items);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const r = await searchFoods(q, ctrl.signal);
        setResults(r);
      } catch (e: any) {
        if (e?.name !== 'AbortError') console.warn('searchFoods', e?.message);
      } finally {
        if (abortRef.current === ctrl) setLoading(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setSelected(null);
    setScanMode(false);
    setScannedCodes(new Set());
    onClose();
  };

  // Récents = derniers items distincts du journal (par nom)
  const recents = React.useMemo(() => {
    const seen = new Set<string>();
    const list: FavoriteItem[] = [];
    const sorted = [...journalEntries].sort((a, b) => b.timestamp - a.timestamp);
    for (const e of sorted) {
      const id = favoriteIdFromFood(e.food);
      if (seen.has(id)) continue;
      seen.add(id);
      list.push({
        id,
        food: e.food,
        emoji: e.emoji,
        image: e.image,
        kcal: e.kcal,
        prot: e.prot,
        glu: e.glu,
        lip: e.lip,
        addedAt: e.timestamp,
      });
      if (list.length >= 8) break;
    }
    return list;
  }, [journalEntries]);

  const reAddItem = (item: FavoriteItem) => {
    addEntry({
      source,
      timestamp: Date.now(),
      food: item.food,
      emoji: item.emoji,
      image: item.image,
      kcal: item.kcal,
      prot: item.prot,
      glu: item.glu,
      lip: item.lip,
    });
    hapticSuccess();
    handleClose();
  };

  const handleConfirm = (food: FoodHit, grams: number) => {
    const m = macrosForPortion(food, grams);
    addEntry({
      source,
      timestamp: Date.now(),
      food: `${food.name} · ${grams}g`,
      emoji: guessEmoji(food.name),
      image: food.image,
      kcal: m.kcal,
      prot: m.prot,
      glu: m.glu,
      lip: m.lip,
    });
    hapticSuccess();
    setSelected(null);
    handleClose();
  };

  const onBarcode = async ({ data }: { data: string }) => {
    if (scannedCodes.has(data)) return;
    setScannedCodes((s) => new Set(s).add(data));
    hapticLight();
    try {
      const food = await getFoodByBarcode(data);
      if (food) {
        hapticSuccess();
        setScanMode(false);
        setSelected(food);
      } else {
        hapticWarning();
        // Le barcode existe pas → on autorise le re-scan après 2s.
        setTimeout(() => {
          setScannedCodes((s) => {
            const next = new Set(s);
            next.delete(data);
            return next;
          });
        }, 2000);
      }
    } catch {
      hapticWarning();
    }
  };

  const openScan = async () => {
    hapticSelection();
    if (!permission?.granted) {
      const r = await requestPermission();
      if (!r.granted) return;
    }
    setScanMode(true);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: C.beige }}>
        {/* Header */}
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={handleClose}
            accessibilityLabel="Fermer"
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
            <Text style={{ fontSize: 11, letterSpacing: 3, color: C.green, fontWeight: '700' }}>AJOUTER UN REPAS</Text>
            <Text style={{ fontFamily: F.display, fontSize: 22, fontWeight: '900', color: C.dark, marginTop: 2 }}>
              {scanMode ? 'Scanner un code-barres' : 'Recherche'}
            </Text>
          </View>
        </View>

        {scanMode ? (
          <BarcodeView
            onBarcode={onBarcode}
            onCancel={() => setScanMode(false)}
            permissionGranted={!!permission?.granted}
          />
        ) : (
          <>
            {/* Search bar */}
            <View
              style={{
                marginHorizontal: 16,
                height: 50,
                borderRadius: 25,
                backgroundColor: C.white,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                gap: 10,
                ...softShadow,
              }}
            >
              <IconSearch />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Poulet, riz, banane..."
                placeholderTextColor="#aaa"
                style={{ flex: 1, fontSize: 15, color: C.dark, fontFamily: F.body, padding: 0 }}
                returnKeyType="search"
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
              />
              {query.length > 0 ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Text style={{ fontSize: 16, color: C.darkSoft }}>✕</Text>
                </Pressable>
              ) : null}
            </View>

            {/* Barcode shortcut */}
            <Pressable
              onPress={openScan}
              style={({ pressed }) => ({
                marginTop: 12,
                marginHorizontal: 16,
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 16,
                backgroundColor: C.green,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ fontSize: 22 }}>📷</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: C.beige }}>Scanner un code-barres</Text>
                <Text style={{ fontSize: 11, color: C.lime, marginTop: 1 }}>3M+ produits Open Food Facts</Text>
              </View>
              <Text style={{ color: C.beige, fontSize: 18 }}>›</Text>
            </Pressable>

            {/* Results */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 16, paddingBottom: insets.bottom + 30, gap: 8 }}
            >
              {loading ? (
                <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                  <ActivityIndicator color={C.green} />
                </View>
              ) : null}

              {!loading && query.trim().length < 2 ? (
                <>
                  {favorites.length > 0 ? (
                    <>
                      <Text style={listSectionTitle}>⭐ Favoris</Text>
                      <View style={{ gap: 8, marginBottom: 16 }}>
                        {favorites.map((f) => (
                          <QuickAddRow key={f.id} item={f} onPress={() => reAddItem(f)} />
                        ))}
                      </View>
                    </>
                  ) : null}

                  {recents.length > 0 ? (
                    <>
                      <Text style={listSectionTitle}>🕒 Récents</Text>
                      <View style={{ gap: 8, marginBottom: 16 }}>
                        {recents.map((r) => (
                          <QuickAddRow key={r.id} item={r} onPress={() => reAddItem(r)} />
                        ))}
                      </View>
                    </>
                  ) : null}

                  {favorites.length === 0 && recents.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }}>
                      <Text style={{ fontSize: 36 }}>🔎</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: C.dark }}>Cherche n'importe quel aliment</Text>
                      <Text style={{ fontSize: 12, color: C.darkSoft, textAlign: 'center', maxWidth: 280, lineHeight: 17 }}>
                        Saisis le nom d'un produit ou scanne son code-barres pour récupérer les macros automatiquement.
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 11, color: C.darkSoft, textAlign: 'center', marginTop: 4, marginBottom: 12 }}>
                      Tape sur un favori ou un récent pour le re-logger en 1 geste.
                    </Text>
                  )}
                </>
              ) : null}

              {!loading && query.trim().length >= 2 && results.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 30, gap: 6 }}>
                  <Text style={{ fontSize: 32 }}>🤷</Text>
                  <Text style={{ fontSize: 13, color: C.darkSoft, textAlign: 'center' }}>
                    Pas de résultat pour "{query.trim()}"
                  </Text>
                </View>
              ) : null}

              {results.map((r) => (
                <Pressable
                  key={r.code}
                  onPress={() => {
                    hapticSelection();
                    setSelected(r);
                  }}
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
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  {r.image ? (
                    <Image source={{ uri: r.image }} style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: C.beige }} />
                  ) : (
                    <View style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: C.beige, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 24 }}>{guessEmoji(r.name)}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: C.dark }} numberOfLines={1}>
                      {r.name}
                    </Text>
                    {r.brand ? (
                      <Text style={{ fontSize: 10, color: C.darkSoft, marginTop: 2 }} numberOfLines={1}>
                        {r.brand}
                      </Text>
                    ) : null}
                    <Text style={{ fontSize: 11, color: C.green, marginTop: 3, fontWeight: '600' }}>
                      {r.per100.kcal} kcal · {r.per100.prot}g prot · {r.per100.glu}g glu · {r.per100.lip}g lip
                      <Text style={{ color: C.darkSoft, fontWeight: '400' }}> /100g</Text>
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        <PortionPickerSheet
          food={selected}
          onClose={() => setSelected(null)}
          onConfirm={handleConfirm}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

function QuickAddRow({ item, onPress }: { item: FavoriteItem; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
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
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: C.beige }} />
      ) : (
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: C.beige, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: C.dark }} numberOfLines={1}>
          {item.food}
        </Text>
        <Text style={{ fontSize: 11, color: C.green, fontWeight: '600', marginTop: 2 }}>
          {Math.round(item.kcal)} kcal · {Math.round(item.prot)}p · {Math.round(item.glu)}g · {Math.round(item.lip)}l
        </Text>
      </View>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 18, color: C.beige, fontWeight: '700', lineHeight: 20, marginTop: -1 }}>+</Text>
      </View>
    </Pressable>
  );
}

const listSectionTitle = {
  fontSize: 11,
  letterSpacing: 2,
  color: C.green,
  fontWeight: '700' as const,
  marginBottom: 8,
};

function BarcodeView({
  onBarcode,
  onCancel,
  permissionGranted,
}: {
  onBarcode: (e: { data: string }) => void;
  onCancel: () => void;
  permissionGranted: boolean;
}) {
  if (!permissionGranted) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: C.dark, textAlign: 'center' }}>
          Autorise l'accès à l'appareil photo pour scanner.
        </Text>
        <Pressable
          onPress={onCancel}
          style={{ marginTop: 16, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, backgroundColor: C.green }}
        >
          <Text style={{ color: C.beige, fontWeight: '700', fontSize: 13 }}>Retour à la recherche</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] }}
        onBarcodeScanned={onBarcode}
      />
      {/* Frame overlay */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 260, height: 160, borderRadius: 18, borderWidth: 2, borderColor: C.lime }} />
        <Text style={{ marginTop: 16, color: C.beige, fontSize: 13, fontWeight: '600' }}>
          Centre le code-barres dans le cadre
        </Text>
      </View>
      <Pressable
        onPress={onCancel}
        style={{
          position: 'absolute',
          left: 20,
          bottom: 50,
          right: 20,
          height: 52,
          borderRadius: 26,
          backgroundColor: C.beige,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: C.dark, fontWeight: '700', fontSize: 14 }}>Saisir manuellement</Text>
      </Pressable>
    </View>
  );
}
