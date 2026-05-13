import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  ScannerModal: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  Objectifs: undefined;
  Identity: undefined;
  Measurements: undefined;
  Activity: undefined;
  Restrictions: undefined;
  Ready: undefined;
};

export type MainTabsParamList = {
  HomeTab: undefined;
  MapTab: undefined;
  ScanTab: undefined;
  SportTab: undefined;
};

export type HomeStackParamList = {
  Dashboard: undefined;
  Journal: { dayKey?: string } | undefined;
  Reservations: undefined;
  Stats: undefined;
  Profile: undefined;
  Social: undefined;
  Fasting: undefined;
  OrderTracking: { id: string };
};

export type MapStackParamList = {
  SmartMap: undefined;
  AchatS1: undefined;
  AchatS2: undefined;
  AchatS3: undefined;
  AchatS4: undefined;
  AchatS5: undefined;
};

export type ScannerStackParamList = {
  ScannerCapture: undefined;
  ScannerResult: undefined;
};

export type SportStackParamList = {
  SportHome: undefined;
};

// Screen prop helpers (import as needed in each screen)
export type OnboardingScreenProps<T extends keyof OnboardingStackParamList> = NativeStackScreenProps<
  OnboardingStackParamList,
  T
>;
export type MapScreenProps<T extends keyof MapStackParamList> = NativeStackScreenProps<MapStackParamList, T>;
export type ScannerScreenProps<T extends keyof ScannerStackParamList> = NativeStackScreenProps<
  ScannerStackParamList,
  T
>;
export type HomeScreenProps<T extends keyof HomeStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, T>,
  BottomTabScreenProps<MainTabsParamList>
>;
export type SportScreenProps<T extends keyof SportStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<SportStackParamList, T>,
  BottomTabScreenProps<MainTabsParamList>
>;
