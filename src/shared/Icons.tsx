import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { C } from '../tokens';

type I = { color?: string; size?: number };

export const IconBack = ({ color = C.dark }: I) => (
  <Svg width={10} height={18} viewBox="0 0 10 18" fill="none">
    <Path d="M9 1L2 9l7 8" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IconBell = ({ color = C.dark }: I) => (
  <Svg width={18} height={20} viewBox="0 0 18 20" fill="none">
    <Path
      d="M9 2c-3.3 0-6 2.7-6 6v3l-2 3h16l-2-3V8c0-3.3-2.7-6-6-6zM7 17a2 2 0 0 0 4 0"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const IconHome = ({ color = C.green, filled = false }: I & { filled?: boolean }) =>
  filled ? (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
      <Path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V11z" />
    </Svg>
  ) : (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V11z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );

export const IconMap = ({ color = C.green }: I) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 3L3 5v16l6-2 6 2 6-2V3l-6 2-6-2z M9 3v16 M15 5v16"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </Svg>
);

export const IconTrophy = ({ color = C.green }: I) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M7 4h10v5a5 5 0 0 1-10 0V4z M7 6H3v2a3 3 0 0 0 3 3 M17 6h4v2a3 3 0 0 1-3 3 M9 19h6 M12 14v5"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const IconUser = ({ color = C.green }: I) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={1.8} />
    <Path d="M4 21c1-4 4-6 8-6s7 2 8 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const IconCamera = ({ color = '#fff' }: I) => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={13} r={4} stroke={color} strokeWidth={1.8} />
  </Svg>
);

export const IconPin = ({ color = C.green, size = 18 }: I) => (
  <Svg width={size} height={size * 1.3} viewBox="0 0 18 24" fill="none">
    <Path
      d="M9 1C4.6 1 1 4.6 1 9c0 6 8 14 8 14s8-8 8-14c0-4.4-3.6-8-8-8z"
      stroke={color}
      strokeWidth={1.8}
      fill="rgba(255,255,255,0.3)"
    />
    <Circle cx={9} cy={9} r={3} fill={color} />
  </Svg>
);

export const IconClock = ({ color = C.green }: I) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} />
    <Path d="M12 7v5l3 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const IconBox = ({ color = C.orange }: I) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 7l9-4 9 4v10l-9 4-9-4V7z M3 7l9 4 9-4 M12 11v10"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </Svg>
);

export const IconSearch = ({ color = C.green }: I) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={2} />
    <Path d="M16 16l5 5" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const IconFilter = ({ color = C.green }: I) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M3 5h18M6 12h12M10 19h4" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const IconCheck = ({ color = '#fff', size = 14 }: I) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12l5 5L20 7" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IconArrow = ({ color = '#fff' }: I) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12h14m-5-6l6 6-6 6" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IconFire = ({ color = C.orange }: I) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2c0 4-5 5-5 11a5 5 0 0 0 10 0c0-2-1-3-2-5 0 3-2 4-2 4s-1-3 0-5-1-5-1-5z" />
  </Svg>
);

export const IconWater = ({ color = C.lime }: I) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2c0 0-7 9-7 13a7 7 0 0 0 14 0c0-4-7-13-7-13z" />
  </Svg>
);

export const IconClose = ({ color = '#fff', size = 18 }: I) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 6l12 12M18 6l-12 12" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
  </Svg>
);

export const IconDumbbell = ({ color = C.green }: I) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 9v6 M5 6v12 M8 8v8 M16 8v8 M19 6v12 M22 9v6 M8 12h8"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

export const IconRecenter = ({ color = C.green }: I) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={3} fill={color} />
    <Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={1.5} />
    <Path d="M12 1v4M12 19v4M1 12h4M19 12h4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
