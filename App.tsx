import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Archivo_900Black } from '@expo-google-fonts/archivo';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope';

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
    const fonts = Font.loadAsync({
      // Display heavy (anciennement Obviously qui n'avait pas les accents)
      Archivo_900Black,
      Obviously: Archivo_900Black,
      // Body sans-serif moderne, charge en 4 poids pour Text + TextInput
      Manrope_400Regular,
      Manrope_500Medium,
      Manrope_600SemiBold,
      Manrope_700Bold,
      // Alias 'Manrope' pour éviter de toucher tous les fontFamily du code
      Manrope: Manrope_400Regular,
    }).catch(() => {
      /* fonts optional — system fallback */
    });

    if (Platform.OS === 'web') {
      // Web/PWA : ne pas bloquer le premier rendu sur ~600 KB de polices —
      // l'UI s'affiche en police système puis bascule quand les fonts arrivent.
      setReady(true);
      SplashScreen.hideAsync().catch(() => {});
      return;
    }

    fonts.then(() => {
      setReady(true);
      SplashScreen.hideAsync().catch(() => {});
    });
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
