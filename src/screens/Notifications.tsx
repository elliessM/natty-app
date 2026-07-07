import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, softShadow, withAlpha } from '../tokens';
import { IconBack } from '../shared/Icons';
import { hapticLight } from '../shared/haptics';
import { useAppNotifications, type AppNotification } from '../hooks/useAppNotifications';
import type { HomeStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Notifications'>;

export default function Notifications() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const items = useAppNotifications();

  const open = (n: AppNotification) => {
    if (!n.target) return;
    hapticLight();
    if (n.target.screen === 'OrderTracking') navigation.navigate('OrderTracking', n.target.params);
    else navigation.navigate(n.target.screen);
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
          <Text style={{ fontSize: 11, letterSpacing: 3, color: C.green, fontWeight: '700' }}>AUJOURD'HUI</Text>
          <Text style={{ fontFamily: F.display, fontSize: 22, fontWeight: '900', color: C.dark, marginTop: 2 }}>
            Notifications
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 30, gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {items.map((n) => (
          <Pressable
            key={n.id}
            onPress={() => open(n)}
            disabled={!n.target}
            accessibilityRole="button"
            accessibilityLabel={n.title}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: 16,
              backgroundColor: C.white,
              borderWidth: 1,
              borderColor: C.beige2,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 13,
                backgroundColor: withAlpha(n.accent, 0.16),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 19 }}>{n.emoji}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: C.dark }}>{n.title}</Text>
              <Text style={{ fontSize: 12, color: C.darkSoft, marginTop: 2, lineHeight: 16 }}>{n.body}</Text>
            </View>
            {n.target ? <Text style={{ fontSize: 16, color: C.mute }}>›</Text> : null}
          </Pressable>
        ))}

        {items.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 80, paddingHorizontal: 32 }}>
            <Text style={{ fontSize: 40 }}>🔕</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.dark, marginTop: 12 }}>Tout est calme</Text>
            <Text style={{ fontSize: 12, color: C.darkSoft, marginTop: 6, textAlign: 'center', lineHeight: 17 }}>
              Tes rappels (hydratation, pesée, commandes, jeûne) apparaîtront ici au fil de la journée.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
