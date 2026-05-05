import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import Svg, { Path } from 'react-native-svg';
import { C, F } from '../tokens';
import { useScanStore, generateMockCandidates } from '../store/useScanStore';
import { hapticMedium, hapticSuccess, hapticSelection } from '../shared/haptics';
import type { ScannerStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<ScannerStackParamList, 'ScannerCapture'>;

const MODES = ['Plat', 'Étiquette', 'Frigo'];

export default function ScannerCapture() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const topY = insets.top + 8;
  const setCandidates = useScanStore((s) => s.setCandidates);
  const cameraRef = useRef<CameraView | null>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [flash, setFlash] = useState<FlashMode>('off');

  useEffect(() => {
    if (!scanning) return;
    let p = 0;
    const iv = setInterval(() => {
      p += 4;
      setProgress(p);
      if (p >= 100) {
        clearInterval(iv);
        hapticSuccess();
        setCandidates(generateMockCandidates());
        navigation.navigate('ScannerResult');
      }
    }, 40);
    return () => clearInterval(iv);
  }, [scanning]);

  const frameTop = 180;
  const frameBottom = 844 - 260;
  const frameHeight = frameBottom - frameTop;

  const close = () => navigation.getParent()?.goBack();

  const triggerScan = async () => {
    if (scanning) return;
    hapticMedium();
    try {
      // Capture a shot (unused in this mock — we just kick the analysis animation).
      if (cameraRef.current) {
        await cameraRef.current.takePictureAsync({ quality: 0.5, skipProcessing: true }).catch(() => {});
      }
    } catch {
      /* ignore — we still run mock analysis */
    }
    setScanning(true);
    setProgress(0);
  };

  // ─── Permission gate ────────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f1511', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.lime} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f1511', padding: 28, justifyContent: 'center' }}>
        <Pressable
          onPress={close}
          accessibilityLabel="Fermer"
          style={{
            position: 'absolute',
            left: 20,
            top: topY,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(0,0,0,0.4)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Path d="M15 6l-6 6 6 6" stroke={C.beige} strokeWidth={2.2} strokeLinecap="round" fill="none" strokeLinejoin="round" />
          </Svg>
        </Pressable>
        <Text style={{ fontFamily: F.display, fontSize: 32, fontWeight: '900', color: C.beige, lineHeight: 36 }}>
          Autorise l'appareil photo
        </Text>
        <Text style={{ fontSize: 14, color: C.lime, marginTop: 14, lineHeight: 20, opacity: 0.85 }}>
          Le Scanner IA a besoin de ta caméra pour analyser tes repas. Aucune photo n'est envoyée tant que tu ne scannes pas.
        </Text>
        <Pressable
          onPress={requestPermission}
          style={{
            marginTop: 28,
            height: 56,
            borderRadius: 28,
            backgroundColor: C.orange,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: C.orange,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 20,
            elevation: 6,
          }}
        >
          <Text style={{ color: C.beige, fontWeight: '700', fontSize: 16 }}>Autoriser la caméra</Text>
        </Pressable>
      </View>
    );
  }

  // ─── Camera view ────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#0f1511', overflow: 'hidden' }}>
      <CameraView
        ref={cameraRef}
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        facing="back"
        flash={flash}
      />

      {/* vignette around scan frame */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: frameTop, backgroundColor: 'rgba(0,0,0,0.55)' }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, top: frameBottom, backgroundColor: 'rgba(0,0,0,0.55)' }} />
      <View style={{ position: 'absolute', top: frameTop, bottom: 844 - frameBottom, left: 0, width: 40, backgroundColor: 'rgba(0,0,0,0.55)' }} />
      <View style={{ position: 'absolute', top: frameTop, bottom: 844 - frameBottom, right: 0, width: 40, backgroundColor: 'rgba(0,0,0,0.55)' }} />

      <Pressable
        onPress={close}
        accessibilityLabel="Fermer le scanner"
        style={{
          position: 'absolute',
          left: 20,
          top: topY,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(0,0,0,0.4)',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
        }}
      >
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Path d="M15 6l-6 6 6 6" stroke={C.beige} strokeWidth={2.2} strokeLinecap="round" fill="none" strokeLinejoin="round" />
        </Svg>
      </Pressable>

      <Text style={{ position: 'absolute', left: 0, right: 0, top: topY + 14, textAlign: 'center', fontSize: 15, fontWeight: '700', color: C.beige }}>
        Scanner IA
      </Text>

      <Pressable
        onPress={() => {
          hapticSelection();
          setFlash((f) => (f === 'on' ? 'off' : 'on'));
        }}
        accessibilityLabel="Torche"
        style={{
          position: 'absolute',
          right: 20,
          top: topY,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: flash === 'on' ? C.lime : 'rgba(0,0,0,0.4)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 16 }}>⚡</Text>
      </Pressable>

      {/* scan frame with corner brackets */}
      <View
        style={{
          position: 'absolute',
          left: 40,
          right: 40,
          top: frameTop,
          height: frameHeight,
          borderWidth: 2,
          borderColor: C.lime,
          borderRadius: 24,
        }}
      >
        {(
          [
            ['tl', { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 }],
            ['tr', { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 }],
            ['bl', { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 }],
            ['br', { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 }],
          ] as const
        ).map(([k, s]) => (
          <View key={k} style={{ position: 'absolute', width: 28, height: 28, borderColor: C.orange, ...s }} />
        ))}
        {scanning ? (
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
              shadowRadius: 20,
              elevation: 6,
            }}
          />
        ) : null}
      </View>

      <Text
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 156,
          textAlign: 'center',
          fontSize: 12,
          color: C.lime,
          fontWeight: '500',
          opacity: 0.85,
        }}
      >
        Centre le plat dans le cadre
      </Text>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 220, flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
        {MODES.map((t, i) => (
          <View key={t} style={{ alignItems: 'center', paddingBottom: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: i === 0 ? '700' : '500', color: i === 0 ? C.orange : 'rgba(252,233,218,0.6)' }}>{t}</Text>
            {i === 0 ? <View style={{ marginTop: 2, width: 4, height: 4, borderRadius: 2, backgroundColor: C.orange }} /> : null}
          </View>
        ))}
      </View>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 120, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40 }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(252,233,218,0.12)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>🖼️</Text>
        </View>
        <Pressable
          onPress={triggerScan}
          disabled={scanning}
          accessibilityLabel="Déclencher le scan"
          style={{ width: 88, height: 88, borderRadius: 44, borderWidth: 4, borderColor: C.beige, alignItems: 'center', justifyContent: 'center' }}
        >
          <View
            style={{
              width: 70,
              height: 70,
              borderRadius: 35,
              backgroundColor: scanning ? C.orange : C.beige,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {scanning ? (
              <Text style={{ color: C.beige, fontSize: 16, fontWeight: '700' }}>{progress}%</Text>
            ) : (
              <Text style={{ fontFamily: F.display, fontWeight: '900', color: C.green, fontSize: 26 }}>N</Text>
            )}
          </View>
        </Pressable>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(252,233,218,0.12)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>⚡</Text>
        </View>
      </View>

      <Text style={{ position: 'absolute', left: 0, right: 0, bottom: 74, textAlign: 'center', fontSize: 11, color: 'rgba(252,233,218,0.65)' }}>
        {scanning ? 'Analyse IA en cours...' : 'Appuie pour analyser'}
      </Text>
    </View>
  );
}
