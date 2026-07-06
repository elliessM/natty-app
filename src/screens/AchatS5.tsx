import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F } from '../tokens';
import StatusBar from '../shared/StatusBar';
import HomeIndicator from '../shared/HomeIndicator';
import { IconCheck } from '../shared/Icons';
import { formatPrice, PRODUCTS } from '../data/products';
import { useCartStore } from '../store/useCartStore';
import { useJournalStore } from '../store/useJournalStore';
import { hapticSuccess } from '../shared/haptics';
import type { MapStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<MapStackParamList, 'AchatS5'>;

const CONFETTI = Array.from({ length: 22 }, (_, i) => ({
  x: Math.random() * 390,
  d: Math.random() * 1500,
  r: Math.random() * 360,
  c: [C.orange, C.lime, C.beige][i % 3],
  s: 6 + Math.random() * 8,
}));

function Confetto({ x, d, r, c, s }: { x: number; d: number; r: number; c: string; s: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 2600,
      delay: d,
      easing: Easing.bezier(0.2, 0.7, 0.3, 1),
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: -20,
        width: s,
        height: s,
        backgroundColor: c,
        borderRadius: 2,
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, 900] }) },
          { rotate: v.interpolate({ inputRange: [0, 1], outputRange: [`${r}deg`, `${r + 720}deg`] }) },
        ],
        opacity: v.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
      }}
    />
  );
}

export default function AchatS5() {
  const navigation = useNavigation<Nav>();
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const addEntry = useJournalStore((s) => s.addEntry);
  const loggedRef = useRef(false);

  useEffect(() => {
    if (loggedRef.current) return;
    loggedRef.current = true;
    hapticSuccess();
    // Chaque unité du panier devient une entrée journal — jalon de consommation future.
    items.forEach((item) => {
      for (let i = 0; i < item.qty; i++) {
        addEntry({
          source: 'purchase',
          timestamp: Date.now() + i, // stagger pour ordre stable
          food: item.t,
          emoji: item.e,
          kcal: item.kcal,
          prot: item.prot,
          glu: item.glu,
          lip: item.lip,
        });
      }
    });
  }, []);
  const display = items.length > 0
    ? items
    : [
        { ...PRODUCTS[0], qty: 1 },
        { ...PRODUCTS[1], qty: 2 },
      ];
  const total = display.reduce((s, c) => s + c.price * c.qty, 0) * 0.95 + 0.3;

  const goJournal = () => {
    clear();
    navigation.popToTop?.();
    navigation.getParent()?.navigate('HomeTab', { screen: 'Journal' });
  };

  const goDashboard = () => {
    clear();
    navigation.popToTop?.();
    navigation.getParent()?.navigate('HomeTab', { screen: 'Dashboard' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.beige, overflow: 'hidden' }}>
      <StatusBar />
      {CONFETTI.map((c, i) => (
        <Confetto key={i} {...c} />
      ))}

      <LinearGradient
        colors={[C.orange, C.orangeSoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: 'absolute',
          left: '50%',
          top: 140,
          marginLeft: -70,
          width: 140,
          height: 140,
          borderRadius: 70,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: C.orange,
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.5,
          shadowRadius: 60,
          elevation: 12,
        }}
      >
        <IconCheck color={C.beige} size={72} />
      </LinearGradient>

      <View style={{ position: 'absolute', left: 40, right: 40, top: 310, alignItems: 'center' }}>
        <Text style={{ fontSize: 12, letterSpacing: 3, color: C.orange, fontWeight: '700' }}>COMMANDE RÉUSSIE</Text>
        <Text style={{ fontFamily: F.display, fontWeight: '900', fontSize: 34, color: C.green, marginTop: 10, textAlign: 'center', lineHeight: 36 }}>
          Bon app' !{'\n'}+50 pts Social Club
        </Text>
      </View>

      <View
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          top: 460,
          backgroundColor: C.white,
          borderRadius: 20,
          paddingVertical: 16,
          paddingHorizontal: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        <Text style={{ fontSize: 10, letterSpacing: 3, color: C.green, fontWeight: '700' }}>RÉCAPITULATIF</Text>
        {display.map((p) => (
          <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f0e5d7' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 20 }}>{p.e}</Text>
              <View>
                <Text style={{ fontWeight: '700', fontSize: 13, color: C.dark }}>{p.t}</Text>
                <Text style={{ fontSize: 10, color: C.darkSoft }}>×{p.qty}</Text>
              </View>
            </View>
            <Text style={{ fontWeight: '700', fontSize: 13, color: C.dark }}>{formatPrice(p.price * p.qty)} €</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10 }}>
          <Text style={{ fontWeight: '700' }}>Total</Text>
          <Text style={{ fontWeight: '700', color: C.orange }}>{formatPrice(total)} €</Text>
        </View>
      </View>

      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 28, gap: 10 }}>
        <Pressable onPress={goJournal} style={{ width: '100%', height: 56, borderRadius: 28, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.beige, fontWeight: '700', fontSize: 15 }}>Voir mon journal</Text>
        </Pressable>
        <Pressable
          onPress={goDashboard}
          style={{
            width: '100%',
            height: 48,
            borderRadius: 24,
            borderWidth: 1.5,
            borderColor: C.green,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: C.green, fontWeight: '700', fontSize: 14 }}>Retour au tableau de bord</Text>
        </Pressable>
      </View>
      <HomeIndicator />
    </View>
  );
}
