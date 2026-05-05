import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { C, F } from '../../tokens';

export type WeightPoint = { date: string; kg: number };

type Props = {
  data: WeightPoint[];
  target?: number;
  height?: number;
};

export default function WeightLineChart({ data, target, height = 160 }: Props) {
  if (data.length < 2) return null;

  const w = 320;
  const padTop = 20;
  const padBottom = 22;
  const padLeft = 10;
  const padRight = 10;
  const innerW = w - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const values = data.map((p) => p.kg);
  if (target != null) values.push(target);
  const min = Math.min(...values) - 0.5;
  const max = Math.max(...values) + 0.5;
  const range = max - min || 1;

  const x = (i: number) => padLeft + (i / (data.length - 1)) * innerW;
  const y = (v: number) => padTop + (1 - (v - min) / range) * innerH;

  const path = data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.kg)}`).join(' ');
  const areaPath = `${path} L ${x(data.length - 1)} ${padTop + innerH} L ${x(0)} ${padTop + innerH} Z`;

  return (
    <View style={{ width: '100%', height }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
        {/* Ligne objectif */}
        {target != null ? (
          <>
            <Line x1={padLeft} x2={w - padRight} y1={y(target)} y2={y(target)} stroke={C.orange} strokeWidth={1.2} strokeDasharray="4 4" opacity={0.7} />
            <SvgText x={w - padRight - 4} y={y(target) - 5} fontSize={9} fontWeight="700" fill={C.orange} textAnchor="end">
              objectif {target}kg
            </SvgText>
          </>
        ) : null}

        {/* Aire dégradée façon "fill" */}
        <Path d={areaPath} fill={C.green} opacity={0.08} />
        {/* Ligne courbe */}
        <Path d={path} fill="none" stroke={C.green} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {/* Points */}
        {data.map((p, i) => {
          const last = i === data.length - 1;
          return (
            <React.Fragment key={i}>
              <Circle cx={x(i)} cy={y(p.kg)} r={last ? 5.5 : 3.5} fill={C.white} stroke={C.green} strokeWidth={last ? 2.5 : 1.5} />
              {last ? (
                <SvgText x={x(i)} y={y(p.kg) - 12} fontSize={11} fontWeight="700" fill={C.dark} textAnchor="end">
                  {p.kg.toFixed(1)} kg
                </SvgText>
              ) : null}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
