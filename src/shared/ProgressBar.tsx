import React from 'react';
import { View, Text } from 'react-native';
import { C } from '../tokens';

type Props = { step: number; total?: number };

export default function ProgressBar({ step, total = 4 }: Props) {
  return (
    <View
      style={{
        position: 'absolute',
        left: '50%',
        marginLeft: -100,
        bottom: 108,
        width: 200,
        alignItems: 'center',
        gap: 10,
      }}
    >
      <View style={{ width: 200, height: 4, borderRadius: 999, backgroundColor: 'rgba(190,211,92,0.25)', overflow: 'hidden' }}>
        <View
          style={{
            width: `${(step / total) * 100}%`,
            height: '100%',
            backgroundColor: C.orange,
            borderRadius: 999,
          }}
        />
      </View>
      <Text style={{ fontSize: 11, color: C.lime, letterSpacing: 2, fontWeight: '700' }}>
        {step} / {total}
      </Text>
    </View>
  );
}
