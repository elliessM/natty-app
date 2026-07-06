import { ViewStyle, TextStyle } from 'react-native';
import { C, F, ctaShadow, withAlpha } from '../tokens';

export const btnPrimary = (): ViewStyle => ({
  width: '100%',
  height: 60,
  borderRadius: 999,
  backgroundColor: C.orange,
  alignItems: 'center',
  justifyContent: 'center',
  ...ctaShadow,
});

export const btnPrimaryLabel: TextStyle = {
  color: C.beige,
  fontWeight: '700',
  fontSize: 17,
  fontFamily: F.body,
};

export const btnDark = (): ViewStyle => ({
  width: '100%',
  height: 60,
  borderRadius: 999,
  backgroundColor: C.green,
  alignItems: 'center',
  justifyContent: 'center',
});

export const btnDarkLabel: TextStyle = {
  color: C.beige,
  fontWeight: '700',
  fontSize: 17,
  fontFamily: F.body,
};

export const btnGhostOnDark = (): ViewStyle => ({
  width: '100%',
  height: 48,
  borderRadius: 999,
  backgroundColor: C.greenAlt,
  alignItems: 'center',
  justifyContent: 'center',
});

export const btnGhostOnDarkLabel: TextStyle = {
  color: C.lime,
  fontWeight: '700',
  fontSize: 15,
  fontFamily: F.body,
};

export const btnSkip = (): ViewStyle => ({
  width: '100%',
  height: 40,
  borderRadius: 999,
  backgroundColor: C.beige3,
  alignItems: 'center',
  justifyContent: 'center',
});

export const btnSkipLabel: TextStyle = {
  color: C.green,
  fontWeight: '700',
  fontSize: 13,
  fontFamily: F.body,
};

export const optionCard = (selected: boolean, accent = C.orange): ViewStyle => ({
  width: '100%',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 14,
  paddingVertical: 14,
  paddingHorizontal: 16,
  borderRadius: 18,
  backgroundColor: selected ? accent : C.beige,
  borderWidth: selected ? 0 : 1.5,
  borderColor: withAlpha(C.green, 0.15),
});
