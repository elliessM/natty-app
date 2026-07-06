import React from 'react';
import { View } from 'react-native';
import { C, withAlpha } from '../tokens';

export default function Ambience() {
  return (
    <>
      <View
        style={{
          position: 'absolute',
          left: -100,
          bottom: -80,
          width: 340,
          height: 340,
          borderRadius: 170,
          backgroundColor: withAlpha(C.lime, 0.08),
        }}
        pointerEvents="none"
      />
      <View
        style={{
          position: 'absolute',
          right: -70,
          top: -50,
          width: 260,
          height: 260,
          borderRadius: 130,
          backgroundColor: withAlpha(C.orange, 0.14),
        }}
        pointerEvents="none"
      />
    </>
  );
}
