import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { C } from '../tokens';
import type { RootStackParamList } from './types';
import { useUserStore } from '../store/useUserStore';
import { useAuthStore } from '../store/useAuthStore';
import OnboardingStack from './OnboardingStack';
import MainTabs from './MainTabs';
import ScannerStack from './ScannerStack';
import AuthScreen from '../screens/AuthScreen';

const Stack = createNativeStackNavigator<RootStackParamList & { Auth: undefined }>();

export default function RootNavigator() {
  const hasOnboarded = useUserStore((s) => s.hasOnboarded);
  const session = useAuthStore((s) => s.session);
  const demoMode = useAuthStore((s) => s.demoMode);
  const loading = useAuthStore((s) => s.loading);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.green }}>
        <ActivityIndicator color={C.lime} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session && !demoMode ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : !hasOnboarded ? (
          <Stack.Screen name="Onboarding" component={OnboardingStack} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="ScannerModal"
              component={ScannerStack}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
