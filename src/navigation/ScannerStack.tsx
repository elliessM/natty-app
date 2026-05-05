import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ScannerStackParamList } from './types';
import ScannerCapture from '../screens/ScannerCapture';
import ScannerResult from '../screens/ScannerResult';

const Stack = createNativeStackNavigator<ScannerStackParamList>();

export default function ScannerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_bottom' }}>
      <Stack.Screen name="ScannerCapture" component={ScannerCapture} />
      <Stack.Screen name="ScannerResult" component={ScannerResult} />
    </Stack.Navigator>
  );
}
