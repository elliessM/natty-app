import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MapStackParamList } from './types';
import SmartMap from '../screens/SmartMap';
import AchatS1 from '../screens/AchatS1';
import AchatS2 from '../screens/AchatS2';
import AchatS3 from '../screens/AchatS3';
import AchatS4 from '../screens/AchatS4';
import AchatS5 from '../screens/AchatS5';

const Stack = createNativeStackNavigator<MapStackParamList>();

export default function MapStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="SmartMap" component={SmartMap} />
      <Stack.Screen name="AchatS1" component={AchatS1} />
      <Stack.Screen name="AchatS2" component={AchatS2} />
      <Stack.Screen name="AchatS3" component={AchatS3} />
      <Stack.Screen name="AchatS4" component={AchatS4} options={{ gestureEnabled: false }} />
      <Stack.Screen name="AchatS5" component={AchatS5} options={{ gestureEnabled: false }} />
    </Stack.Navigator>
  );
}
