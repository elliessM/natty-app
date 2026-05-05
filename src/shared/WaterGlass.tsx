import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Defs, ClipPath, Path, Rect, LinearGradient, Stop } from 'react-native-svg';
import { C } from '../tokens';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

type Props = {
  pct: number; // 0 → 1
  size?: number;
  reached?: boolean;
};

/**
 * Silhouette de verre (SVG) avec remplissage animé.
 * Le liquide est un Rect clippé par le contour du verre.
 */
export default function WaterGlass({ pct, size = 48, reached = false }: Props) {
  const vb = 48; // viewBox size
  const fill = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(1, pct));

  useEffect(() => {
    Animated.timing(fill, {
      toValue: clamped,
      duration: 600,
      easing: Easing.bezier(0.2, 0.7, 0.3, 1),
      useNativeDriver: false,
    }).start();
  }, [clamped]);

  // liquide : rectangle qui monte depuis le bas du verre, clippé par la forme.
  const liquidHeight = fill.interpolate({ inputRange: [0, 1], outputRange: [0, 36] });
  const liquidY = fill.interpolate({ inputRange: [0, 1], outputRange: [44, 8] });

  const topColor = reached ? C.lime : '#a8c8e6';
  const bottomColor = reached ? '#9ec04a' : '#6aa4d6';

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`}>
        <Defs>
          <ClipPath id="glassClip">
            {/* forme intérieure du verre (bords arrondis, léger évasement) */}
            <Path d="M14 9 L34 9 L32 43 Q32 45 30 45 L18 45 Q16 45 16 43 Z" />
          </ClipPath>
          <LinearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={topColor} stopOpacity="0.95" />
            <Stop offset="100%" stopColor={bottomColor} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* fond intérieur (couleur papier) pour faire ressortir le liquide */}
        <Path d="M14 9 L34 9 L32 43 Q32 45 30 45 L18 45 Q16 45 16 43 Z" fill="rgba(0,0,0,0.04)" />

        {/* liquide animé */}
        <AnimatedRect
          x={0}
          y={liquidY}
          width={vb}
          height={liquidHeight}
          fill="url(#waterGrad)"
          clipPath="url(#glassClip)"
        />

        {/* surface brillante (reflet) */}
        <Path
          d="M18 12 L22 12"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* contour du verre */}
        <Path
          d="M14 8 L34 8 L32 43 Q32 46 29 46 L19 46 Q16 46 16 43 Z"
          stroke={C.dark}
          strokeWidth="1.8"
          fill="none"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
