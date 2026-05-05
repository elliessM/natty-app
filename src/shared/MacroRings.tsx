import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { C } from '../tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = { size?: number; values?: [number, number, number]; thickness?: number };

export default function MacroRings({ size = 168, values = [78, 72, 60], thickness = 9 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  // Tighter ring stack: 9px thick, 4px gap between rings → more room in the center for text.
  const rings = [
    { r: size / 2 - 6, color: C.orange, bg: 'rgba(237,126,0,0.18)', v: values[0] },
    { r: size / 2 - 19, color: C.lime, bg: 'rgba(190,211,92,0.2)', v: values[1] },
    { r: size / 2 - 32, color: C.beige, bg: 'rgba(252,233,218,0.15)', v: values[2] },
  ];

  const anims = useRef(rings.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel(
      rings.map((r, i) =>
        Animated.timing(anims[i], {
          toValue: r.v,
          duration: 1200,
          easing: Easing.bezier(0.2, 0.7, 0.3, 1),
          useNativeDriver: false,
        })
      )
    ).start();
  }, [values.join(',')]);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((r, i) => {
        const circumference = 2 * Math.PI * r.r;
        const dashInterp = anims[i].interpolate({
          inputRange: [0, 100],
          outputRange: [0, circumference],
        });
        return (
          <G key={i} rotation={-90} originX={cx} originY={cy}>
            <Circle cx={cx} cy={cy} r={r.r} stroke={r.bg} strokeWidth={thickness} fill="none" />
            <AnimatedCircle
              cx={cx}
              cy={cy}
              r={r.r}
              stroke={r.color}
              strokeWidth={thickness}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              // @ts-ignore animated value on non-animated prop fallback
              strokeDashoffset={Animated.subtract(circumference, dashInterp)}
            />
          </G>
        );
      })}
    </Svg>
  );
}
