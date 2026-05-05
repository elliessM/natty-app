export const C = {
  green: '#00412f',
  greenAlt: '#063d2b',
  greenDeep: '#00321f',
  lime: '#bed35c',
  limeSoft: '#d4e07a',
  orange: '#ed7e00',
  orangeSoft: '#ff9f3c',
  beige: '#fce9da',
  beige2: '#eadccb',
  beige3: '#e8e0d8',
  dark: '#211d15',
  darkSoft: '#5a5042',
  white: '#ffffff',
  mute: '#8a8a8a',
};

export const F = {
  display: 'Obviously',
  body: 'Manrope',
};

export const SCREEN_W = 390;
export const SCREEN_H = 844;

export const softShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2,
} as const;

export const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.05,
  shadowRadius: 20,
  elevation: 4,
} as const;

export const ctaShadow = {
  shadowColor: C.orange,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.3,
  shadowRadius: 20,
  elevation: 8,
} as const;
