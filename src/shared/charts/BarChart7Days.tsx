import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { C, F } from '../../tokens';

export type DayDatum = {
  label: string; // "Lun"
  value: number; // kcal
  isToday?: boolean;
};

type Props = {
  data: DayDatum[];
  goal: number;
  height?: number;
  showLabels?: boolean;
  showValues?: boolean;
};

/**
 * Graph en barres simple sur N jours, ligne pointillée = objectif.
 * Utilise react-native-svg, pas de lib externe.
 */
export default function BarChart7Days({ data, goal, height = 160, showLabels = true, showValues = false }: Props) {
  if (data.length === 0) return null;

  const max = Math.max(goal * 1.15, ...data.map((d) => d.value), 1);
  const padTop = showValues ? 22 : 8;
  const padBottom = showLabels ? 22 : 6;
  const innerH = height - padTop - padBottom;

  // largeur barre = pourcentage de la largeur dispo
  const barRatio = 0.55;

  return (
    <View style={{ width: '100%', height }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${data.length * 100} ${height}`} preserveAspectRatio="none">
        {/* Ligne objectif */}
        <Line
          x1={0}
          x2={data.length * 100}
          y1={padTop + (1 - goal / max) * innerH}
          y2={padTop + (1 - goal / max) * innerH}
          stroke={C.green}
          strokeWidth={1.5}
          strokeDasharray="4 4"
          opacity={0.4}
        />

        {data.map((d, i) => {
          const cx = i * 100 + 50;
          const barW = 100 * barRatio;
          const valueRatio = d.value / max;
          const barH = Math.max(2, valueRatio * innerH);
          const y = padTop + innerH - barH;
          const reached = d.value >= goal;
          const close = !reached && d.value >= goal * 0.7;
          const color = d.value === 0 ? C.beige2 : reached ? C.orange : close ? C.lime : '#d8d2c8';

          return (
            <React.Fragment key={i}>
              {showValues && d.value > 0 ? (
                <SvgText
                  x={cx}
                  y={y - 6}
                  fontSize={10}
                  fontWeight="700"
                  fill={C.dark}
                  textAnchor="middle"
                >
                  {Math.round(d.value)}
                </SvgText>
              ) : null}
              <Rect
                x={cx - barW / 2}
                y={y}
                width={barW}
                height={barH}
                rx={6}
                fill={color}
                opacity={d.isToday ? 1 : d.value === 0 ? 0.4 : 0.85}
              />
              {showLabels ? (
                <SvgText
                  x={cx}
                  y={height - 6}
                  fontSize={11}
                  fontWeight={d.isToday ? '700' : '500'}
                  fill={d.isToday ? C.green : C.darkSoft}
                  textAnchor="middle"
                >
                  {d.label}
                </SvgText>
              ) : null}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
