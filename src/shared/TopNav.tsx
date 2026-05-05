import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, softShadow } from '../tokens';
import { IconBack } from './Icons';

type Props = { onBack?: () => void; stepText?: string };

export default function TopNav({ onBack, stepText }: Props) {
  const insets = useSafeAreaInsets();
  const top = insets.top + 8;
  return (
    <>
      <Pressable
        onPress={onBack}
        accessibilityLabel="Retour"
        hitSlop={12}
        style={{
          position: 'absolute',
          left: 20,
          top,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: C.white,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
          ...softShadow,
        }}
      >
        <IconBack color={C.dark} />
      </Pressable>
      {stepText ? (
        <View
          style={{
            position: 'absolute',
            right: 20,
            top: top + 10,
            paddingVertical: 6,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: C.white,
            borderWidth: 1,
            borderColor: 'rgba(190,211,92,0.6)',
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: C.green }}>{stepText}</Text>
        </View>
      ) : null}
    </>
  );
}
