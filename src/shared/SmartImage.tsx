import React, { useState } from 'react';
import { Image, View, Text, ActivityIndicator, StyleProp, ViewStyle, ImageSourcePropType } from 'react-native';
import { C } from '../tokens';

type Props = {
  /** URL string or local require() asset */
  source: string | ImageSourcePropType | undefined;
  /** Shown while loading, on error, or when source is undefined */
  fallbackEmoji?: string;
  /** Size of the fallback emoji */
  emojiSize?: number;
  /** Container style (layout) */
  style?: StyleProp<ViewStyle>;
  /** Background color behind the image while loading / on fallback */
  bgColor?: string;
};

export default function SmartImage({ source, fallbackEmoji, emojiSize = 48, style, bgColor }: Props) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const showFallback = !source || error;

  return (
    <View style={[{ overflow: 'hidden', backgroundColor: bgColor ?? 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center' }, style]}>
      {!showFallback ? (
        <Image
          source={typeof source === 'string' ? { uri: source } : source}
          style={{ width: '100%', height: '100%' }}
          onError={() => setError(true)}
          onLoad={() => setLoaded(true)}
          resizeMode="cover"
        />
      ) : null}
      {(!loaded || showFallback) && fallbackEmoji ? (
        <View style={{ position: 'absolute', inset: 0 as any, top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}>
          {showFallback ? (
            <Text style={{ fontSize: emojiSize }}>{fallbackEmoji}</Text>
          ) : (
            <ActivityIndicator color={C.green} />
          )}
        </View>
      ) : null}
    </View>
  );
}
