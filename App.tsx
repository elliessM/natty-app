import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import RootNavigator from './src/navigation/RootNavigator';
import { C } from './src/tokens';
import { useCloudSync } from './src/hooks/useCloudSync';
import { useNotificationsSync } from './src/hooks/useNotificationsSync';
import { useReservationNotifs } from './src/hooks/useReservationNotifs';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Root() {
  useCloudSync();
  useNotificationsSync();
  useReservationNotifs();
  return <RootNavigator />;
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await Font.loadAsync({
          Obviously: require('./assets/fonts/ObviouslyDemo-Black.otf'),
        });
      } catch {
        /* fonts optional — system fallback */
      }
      setReady(true);
      SplashScreen.hideAsync().catch(() => {});
    })();
  }, []);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: C.beige }}>
          <StatusBar style="auto" />
          <Root />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
