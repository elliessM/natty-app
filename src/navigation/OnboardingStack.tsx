import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from './types';
import { useAuthStore } from '../store/useAuthStore';
import OnbWelcome from '../screens/OnbWelcome';
import OnbHowItWorks from '../screens/OnbHowItWorks';
import OnbObjectifs from '../screens/OnbObjectifs';
import OnbIdentity from '../screens/OnbIdentity';
import OnbMeasurements from '../screens/OnbMeasurements';
import OnbActivity from '../screens/OnbActivity';
import OnbRestrictions from '../screens/OnbRestrictions';
import OnbReady from '../screens/OnbReady';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingStack() {
  // Mode démo (jury) : on saute l'onboarding complet pour arriver direct aux restrictions.
  const demoMode = useAuthStore((s) => s.demoMode);
  return (
    <Stack.Navigator
      initialRouteName={demoMode ? 'Restrictions' : 'Welcome'}
      screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: '#00412f' } }}
    >
      <Stack.Screen name="Welcome" component={OnbWelcome} />
      <Stack.Screen name="HowItWorks" component={OnbHowItWorks} />
      <Stack.Screen name="Objectifs" component={OnbObjectifs} />
      <Stack.Screen name="Identity" component={OnbIdentity} />
      <Stack.Screen name="Measurements" component={OnbMeasurements} />
      <Stack.Screen name="Activity" component={OnbActivity} />
      <Stack.Screen name="Restrictions" component={OnbRestrictions} />
      <Stack.Screen name="Ready" component={OnbReady} />
    </Stack.Navigator>
  );
}
