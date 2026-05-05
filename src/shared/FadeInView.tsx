import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ViewStyle, StyleProp } from 'react-native';

type Props = {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  translateY?: number;
  style?: StyleProp<ViewStyle>;
};

export default function FadeInView({ children, delay = 0, duration = 420, translateY = 12, style }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(translateY)).current;

  useEffect(() => {
    const easing = Easing.bezier(0.2, 0.7, 0.3, 1);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration, delay, easing, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration, delay, easing, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY: ty }] }, style]}>{children}</Animated.View>
  );
}
