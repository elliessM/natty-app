import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { C, F } from '../tokens';
import StatusBar from '../shared/StatusBar';
import HomeIndicator from '../shared/HomeIndicator';
import Ambience from '../shared/Ambience';
import { IconCheck } from '../shared/Icons';
import { hapticLight, hapticSuccess } from '../shared/haptics';
import type { MapStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<MapStackParamList, 'AchatS4'>;

function usePulse(delay: number, active: boolean) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration: 2000, easing: Easing.bezier(0.2, 0.7, 0.3, 1), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [active]);
  return v;
}

export default function AchatS4() {
  const navigation = useNavigation<Nav>();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => {
      hapticLight();
      setPhase(1);
    }, 1600);
    const t2 = setTimeout(() => {
      hapticSuccess();
      setPhase(2);
    }, 3200);
    const t3 = setTimeout(() => navigation.navigate('AchatS5'), 4600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const pulseActive = phase < 2;
  const p0 = usePulse(0, pulseActive);
  const p1 = usePulse(600, pulseActive);
  const p2 = usePulse(1200, pulseActive);
  const pulses = [p0, p1, p2];

  return (
    <View style={{ flex: 1, backgroundColor: C.green, overflow: 'hidden' }}>
      <Ambience />
      <StatusBar dark />
      <Text style={{ position: 'absolute', left: 0, right: 0, top: 100, textAlign: 'center', fontSize: 11, letterSpacing: 3, color: C.lime, fontWeight: '700' }}>
        4 / 4 · OUVERTURE
      </Text>

      <View style={{ position: 'absolute', left: 0, right: 0, top: 230, alignItems: 'center', height: 240, justifyContent: 'center' }}>
        {pulses.map((v, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              width: 240,
              height: 240,
              borderRadius: 120,
              borderWidth: 2,
              borderColor: pulseActive ? C.lime : C.orange,
              opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0] }),
              transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.3] }) }],
            }}
          />
        ))}
        <View
          style={{
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: phase < 2 ? C.greenAlt : C.orange,
            borderWidth: 3,
            borderColor: phase < 2 ? C.lime : C.beige,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: C.orange,
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: phase < 2 ? 0 : 0.5,
            shadowRadius: 60,
            elevation: 10,
          }}
        >
          {phase < 2 ? <Text style={{ fontSize: 48 }}>📶</Text> : <IconCheck color={C.beige} size={64} />}
        </View>
      </View>

      <View style={{ position: 'absolute', left: 40, right: 40, top: 500, alignItems: 'center' }}>
        <Text style={{ fontFamily: F.display, fontWeight: '900', fontSize: 30, color: C.beige, textAlign: 'center' }}>
          {phase === 0 ? 'Connexion Bluetooth...' : phase === 1 ? 'Frigo détecté !' : 'Porte ouverte ✓'}
        </Text>
        <Text style={{ fontSize: 14, color: C.lime, opacity: 0.8, marginTop: 10, lineHeight: 20, textAlign: 'center' }}>
          {phase === 0
            ? 'On cherche le Smart Fridge à proximité...'
            : phase === 1
            ? 'Ouverture automatique en cours'
            : 'Récupère tes articles sur l’étagère 2'}
        </Text>
      </View>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 120, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                width: i <= phase ? 28 : 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: i <= phase ? C.orange : 'rgba(252,233,218,0.2)',
              }}
            />
          ))}
        </View>
      </View>
      <HomeIndicator dark />
    </View>
  );
}
