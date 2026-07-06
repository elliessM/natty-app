import React from 'react';
import { View, Text } from 'react-native';
import { C, withAlpha } from '../tokens';

type Props = { step: number; total: number; tone?: 'light' | 'dark' };

/**
 * Barre de progression unifiée pour l'onboarding (utilisée à la place de
 * ProgressBar quand on a un nombre d'étapes variable).
 */
export default function OnboardingProgress({ step, total, tone = 'light' }: Props) {
  const onDark = tone === 'dark';
  const trackBg = onDark ? withAlpha(C.lime, 0.25) : withAlpha(C.green, 0.12);
  const labelColor = onDark ? C.lime : C.green;

  return (
    <View style={{ alignItems: 'center', gap: 10 }}>
      <View style={{ width: 200, height: 4, borderRadius: 999, backgroundColor: trackBg, overflow: 'hidden' }}>
        <View style={{ width: `${(step / total) * 100}%`, height: '100%', backgroundColor: C.orange, borderRadius: 999 }} />
      </View>
      <Text style={{ fontSize: 11, color: labelColor, letterSpacing: 2, fontWeight: '700' }}>
        {step} / {total}
      </Text>
    </View>
  );
}
