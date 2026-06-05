import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import Svg, { Path } from 'react-native-svg';
import CameraSurface, { type BarcodeEvent } from '../shared/CameraSurface';
import { C, F } from '../tokens';
import { useScanStore, generateMockCandidates, type ScanCandidate } from '../store/useScanStore';
import { hapticMedium, hapticSuccess, hapticSelection, hapticWarning, hapticLight } from '../shared/haptics';
import { getFoodByBarcode, macrosForPortion, guessEmoji } from '../api/foods';
import FoodSearchModal from './FoodSearchModal';
import type { ScannerStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<ScannerStackParamList, 'ScannerCapture'>;
type Mode = 'plat' | 'etiquette' | 'frigo';

const MODES: Array<{ id: Mode; label: string; emoji: string; hint: string }> = [
  { id: 'plat', label: 'Plat', emoji: '🍽️', hint: 'Centre le plat dans le cadre' },
  { id: 'etiquette', label: 'Étiquette', emoji: '🏷️', hint: 'Vise le code-barres' },
  { id: 'frigo', label: 'Frigo', emoji: '📦', hint: 'Scanne le QR code du frigo' },
];

export default function ScannerCapture() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>('plat');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [seenCodes, setSeenCodes] = useState<Set<string>>(new Set());
  const [searchOpen, setSearchOpen] = useState(false);

  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const setCandidates = useScanStore((s) => s.setCandidates);

  // Demande permission à la première ouverture
  useEffect(() => {
    if (!permission) return;
    if (!permission.granted && permission.canAskAgain) requestPermission();
  }, [permission]);

  // ─── Mode Plat — shutter + faux progress puis résultats IA ─────
  useEffect(() => {
    if (mode !== 'plat' || !scanning) return;
    let p = 0;
    const iv = setInterval(() => {
      p += 4;
      setProgress(p);
      if (p >= 100) {
        clearInterval(iv);
        hapticSuccess();
        setCandidates(generateMockCandidates());
        setScanning(false);
        setProgress(0);
        navigation.navigate('ScannerResult');
      }
    }, 40);
    return () => clearInterval(iv);
  }, [mode, scanning]);

  // Reset le mode à chaque switch
  useEffect(() => {
    setScanning(false);
    setProgress(0);
    setSeenCodes(new Set());
  }, [mode]);

  const close = () => navigation.getParent()?.goBack();

  // ─── Mode Étiquette — barcode → OFF ────────────────────────────
  const onBarcodeFood = async ({ data, type }: { data: string; type: string }) => {
    if (mode !== 'etiquette' || busy || seenCodes.has(data)) return;
    setSeenCodes((s) => new Set(s).add(data));
    setBusy(true);
    hapticLight();
    try {
      const food = await getFoodByBarcode(data);
      if (!food) {
        hapticWarning();
        Alert.alert('Produit inconnu', "Ce code-barres n'est pas dans la base Open Food Facts.");
        setTimeout(() => setSeenCodes((s) => { const n = new Set(s); n.delete(data); return n; }), 2000);
        return;
      }
      hapticSuccess();
      // On injecte le résultat dans le scan store puis on navigue vers Result
      const m = macrosForPortion(food, food.servingGrams && food.servingGrams > 0 ? food.servingGrams : 100);
      const candidate: ScanCandidate = {
        food: food.name,
        emoji: guessEmoji(food.name),
        kcal: m.kcal,
        prot: m.prot,
        glu: m.glu,
        lip: m.lip,
        confidence: 1,
      };
      setCandidates([candidate]);
      navigation.navigate('ScannerResult');
    } catch {
      hapticWarning();
    } finally {
      setBusy(false);
    }
  };

  // ─── Mode Frigo — QR ───────────────────────────────────────────
  const onBarcodeFridge = async ({ data }: { data: string }) => {
    if (mode !== 'frigo' || busy || seenCodes.has(data)) return;
    setSeenCodes((s) => new Set(s).add(data));
    setBusy(true);
    hapticSuccess();
    // Pour la démo : on simule la reconnaissance d'un frigo Natty
    Alert.alert(
      '📦 Frigo Natty détecté',
      'Fitness Club Paris 11. Voir le stock disponible ?',
      [
        { text: 'Annuler', style: 'cancel', onPress: () => { setBusy(false); } },
        {
          text: 'Voir le stock',
          onPress: () => {
            setBusy(false);
            close();
            setTimeout(() => {
              navigation.getParent()?.getParent()?.navigate('Main', {
                screen: 'MapTab',
                params: { screen: 'AchatS1' },
              });
            }, 200);
          },
        },
      ]
    );
  };

  // Routeur unique : la surface caméra remonte toute détection ici, on
  // dispatche selon le mode (les handlers re-vérifient le mode par sécurité).
  const handleBarcode = (e: BarcodeEvent) => {
    if (mode === 'etiquette') onBarcodeFood(e);
    else if (mode === 'frigo') onBarcodeFridge(e);
  };

  const triggerPhoto = async () => {
    if (scanning) return;
    hapticMedium();
    setScanning(true);
    setProgress(0);
    try {
      // Best effort — sur web takePictureAsync n'existe pas, on simule.
      await cameraRef.current?.takePictureAsync?.({ quality: 0.5, skipProcessing: true }).catch(() => {});
    } catch {}
  };

  const currentMode = MODES.find((m) => m.id === mode)!;

  // ─── Render ────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <CameraSurface ref={cameraRef} mode={mode} torch={flash === 'on'} onBarcode={handleBarcode} />

      {/* Overlay sombre + cadre */}
      <View pointerEvents="none" style={{ position: 'absolute', inset: 0 as any, top: 0, bottom: 0, left: 0, right: 0 }}>
        {/* Tint sombre légère */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,10,10,0.25)' }} />

        {/* Cadre central */}
        <Frame mode={mode} progress={scanning ? progress : 0} />
      </View>

      {/* Header */}
      <View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable
          onPress={close}
          accessibilityLabel="Fermer"
          hitSlop={12}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(0,0,0,0.45)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Path d="M15 6l-6 6 6 6" stroke={C.beige} strokeWidth={2.4} strokeLinecap="round" fill="none" strokeLinejoin="round" />
          </Svg>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontFamily: F.bodyBold, fontSize: 13, color: C.beige, letterSpacing: 1 }}>
            SCANNER · {currentMode.label.toUpperCase()}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            hapticSelection();
            setFlash((f) => (f === 'on' ? 'off' : 'on'));
          }}
          accessibilityLabel="Lampe torche"
          hitSlop={12}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: flash === 'on' ? C.orange : 'rgba(0,0,0,0.45)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 16 }}>⚡</Text>
        </Pressable>
      </View>

      {/* Hint sous le cadre */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: insets.top + 64, alignItems: 'center' }}>
        <View style={{ paddingHorizontal: 14, paddingVertical: 7, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 999 }}>
          <Text style={{ fontFamily: F.bodyMedium, fontSize: 12, color: C.beige }}>{currentMode.hint}</Text>
        </View>
      </View>

      {/* Busy indicator */}
      {busy && mode !== 'plat' ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: '45%', alignItems: 'center' }}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 999, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <ActivityIndicator color={C.lime} size="small" />
            <Text style={{ fontFamily: F.bodyMedium, color: C.beige, fontSize: 13 }}>Recherche...</Text>
          </View>
        </View>
      ) : null}

      {/* Bottom controls — mode chips + shutter + secondaire */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingTop: 16,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 14,
          gap: 14,
        }}
      >
        {/* Chips Plat / Étiquette / Frigo */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {MODES.map((m) => {
            const active = mode === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => {
                  hapticSelection();
                  setMode(m.id);
                }}
                hitSlop={6}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  backgroundColor: active ? C.lime : 'rgba(252,233,218,0.12)',
                  borderWidth: 1,
                  borderColor: active ? C.lime : 'rgba(252,233,218,0.22)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Text style={{ fontSize: 13 }}>{m.emoji}</Text>
                <Text
                  style={{
                    fontFamily: F.bodyBold,
                    fontSize: 11,
                    color: active ? C.green : C.beige,
                    letterSpacing: 0.5,
                  }}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Shutter — uniquement en mode Plat (sinon scan auto) */}
        {mode === 'plat' ? (
          <View style={{ alignItems: 'center' }}>
            <Pressable
              onPress={triggerPhoto}
              disabled={scanning}
              accessibilityLabel="Déclencher le scan"
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                borderWidth: 4,
                borderColor: C.beige,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: scanning ? C.orange : C.beige,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {scanning ? (
                  <Text style={{ color: C.beige, fontFamily: F.bodyBold, fontSize: 13 }}>{progress}%</Text>
                ) : (
                  <Text style={{ fontFamily: F.display, fontWeight: '900', color: C.green, fontSize: 24, lineHeight: 26 }}>
                    N
                  </Text>
                )}
              </View>
            </Pressable>
          </View>
        ) : (
          <View style={{ height: 80, alignItems: 'center', justifyContent: 'center' }}>
            <View
              style={{
                paddingVertical: 10,
                paddingHorizontal: 18,
                borderRadius: 999,
                backgroundColor: 'rgba(252,233,218,0.12)',
                borderWidth: 1,
                borderColor: 'rgba(252,233,218,0.22)',
              }}
            >
              <Text style={{ fontFamily: F.bodyMedium, color: C.beige, fontSize: 12 }}>Scan auto à la détection</Text>
            </View>
          </View>
        )}

        {/* Lien secondaire vers la recherche manuelle */}
        <Pressable
          onPress={() => {
            hapticLight();
            setSearchOpen(true);
          }}
          accessibilityLabel="Saisir manuellement"
          hitSlop={8}
          style={{ alignItems: 'center' }}
        >
          <Text style={{ fontFamily: F.bodyMedium, color: C.lime, fontSize: 12 }}>
            🔍 Saisir un aliment manuellement
          </Text>
        </Pressable>
      </View>

      {/* Permission denied fallback */}
      {permission && !permission.granted ? (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 30,
            backgroundColor: 'rgba(0,0,0,0.7)',
          }}
        >
          <Text style={{ fontFamily: F.display, fontSize: 22, color: C.beige, textAlign: 'center' }}>
            Accès caméra refusé
          </Text>
          <Text style={{ fontFamily: F.body, fontSize: 13, color: C.lime, textAlign: 'center', marginTop: 10, lineHeight: 19 }}>
            Active la caméra dans les réglages iOS pour scanner tes repas, étiquettes et frigos.
          </Text>
          <Pressable
            onPress={() => requestPermission()}
            style={{ marginTop: 20, paddingVertical: 10, paddingHorizontal: 22, borderRadius: 999, backgroundColor: C.orange }}
          >
            <Text style={{ color: C.beige, fontFamily: F.bodyBold, fontSize: 13 }}>Réessayer</Text>
          </Pressable>
        </View>
      ) : null}

      <FoodSearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} source="manual" />
    </View>
  );
}

// ─── Cadre central selon le mode ─────────────────────────────────────
function Frame({ mode, progress }: { mode: Mode; progress: number }) {
  // Dimensions du cadre selon mode
  const isWide = mode === 'etiquette'; // étiquette = rectangle horizontal
  const isSquare = mode === 'frigo';
  const size = isWide ? { w: 280, h: 140 } : { w: 280, h: 280 };

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size.w,
          height: size.h,
          borderRadius: isSquare ? 20 : 24,
          borderWidth: 2,
          borderColor: 'rgba(190,211,92,0.65)',
        }}
      >
        {/* 4 coins orange */}
        {[
          { top: -2, left: -2, br: { borderTopLeftRadius: 14 }, edges: ['top', 'left'] },
          { top: -2, right: -2, br: { borderTopRightRadius: 14 }, edges: ['top', 'right'] },
          { bottom: -2, left: -2, br: { borderBottomLeftRadius: 14 }, edges: ['bottom', 'left'] },
          { bottom: -2, right: -2, br: { borderBottomRightRadius: 14 }, edges: ['bottom', 'right'] },
        ].map((c, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: 26,
              height: 26,
              borderColor: C.orange,
              ...c,
              ...c.br,
              borderTopWidth: c.edges.includes('top') ? 4 : 0,
              borderBottomWidth: c.edges.includes('bottom') ? 4 : 0,
              borderLeftWidth: c.edges.includes('left') ? 4 : 0,
              borderRightWidth: c.edges.includes('right') ? 4 : 0,
            }}
          />
        ))}

        {/* Ligne de scan animée — uniquement en mode Plat pendant la capture */}
        {progress > 0 ? (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${progress}%`,
              height: 3,
              backgroundColor: C.lime,
              shadowColor: C.lime,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 14,
              elevation: 6,
            }}
          />
        ) : null}
      </View>
    </View>
  );
}
