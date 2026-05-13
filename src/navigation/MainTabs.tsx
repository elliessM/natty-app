import React from 'react';
import { View, Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { C } from '../tokens';
import type {
  MainTabsParamList,
  HomeStackParamList,
  SportStackParamList,
  SocialStackParamList,
} from './types';

import Dashboard from '../screens/Dashboard';
import Journal from '../screens/Journal';
import Reservations from '../screens/Reservations';
import Stats from '../screens/Stats';
import Social from '../screens/Social';
import ProfileStub from '../screens/ProfileStub';
import Sport from '../screens/Sport';
import Fasting from '../screens/Fasting';
import OrderTracking from '../screens/OrderTracking';
import MapStack from './MapStack';
import { IconHome, IconMap, IconDumbbell, IconTrophy, IconCamera } from '../shared/Icons';
import { hapticMedium } from '../shared/haptics';
import { useCartStore } from '../store/useCartStore';

const Tabs = createBottomTabNavigator<MainTabsParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const SportStack = createNativeStackNavigator<SportStackParamList>();
const SocialStack = createNativeStackNavigator<SocialStackParamList>();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <HomeStack.Screen name="Dashboard" component={Dashboard} />
      <HomeStack.Screen name="Journal" component={Journal} />
      <HomeStack.Screen name="Reservations" component={Reservations} />
      <HomeStack.Screen name="Stats" component={Stats} />
      <HomeStack.Screen name="Profile" component={ProfileStub} />
      <HomeStack.Screen name="Social" component={Social} />
      <HomeStack.Screen name="Fasting" component={Fasting} />
      <HomeStack.Screen name="OrderTracking" component={OrderTracking} />
    </HomeStack.Navigator>
  );
}

function SportStackScreen() {
  return (
    <SportStack.Navigator screenOptions={{ headerShown: false }}>
      <SportStack.Screen name="SportHome" component={Sport} />
    </SportStack.Navigator>
  );
}

function SocialStackScreen() {
  return (
    <SocialStack.Navigator screenOptions={{ headerShown: false }}>
      <SocialStack.Screen name="SocialHome" component={Social} />
    </SocialStack.Navigator>
  );
}

const ScanDummy = () => null;

// On laisse react-navigation calculer la hauteur native (49 + safe area bottom),
// sinon iOS double-compte le safe area et la tab bar paraît énorme.
const TAB_BAR_STYLE = {
  backgroundColor: C.white,
  borderTopWidth: 1,
  borderTopColor: C.beige2,
} as const;

function mapTabBarStyle(route: any) {
  const focused = getFocusedRouteNameFromRoute(route) ?? 'SmartMap';
  if (focused !== 'SmartMap') return { display: 'none' as const };
  return TAB_BAR_STYLE;
}

function CenterScanButton() {
  const nav = useNavigation<any>();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Scanner un repas"
        onPress={() => {
          hapticMedium();
          const root = nav.getParent?.() ?? nav;
          root.navigate('ScannerModal');
        }}
        hitSlop={10}
        style={{ top: -22 }}
      >
        <LinearGradient
          colors={[C.orange, C.orangeSoft]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: C.orange,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.5,
            shadowRadius: 24,
            elevation: 8,
          }}
        >
          <IconCamera />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

export default function MainTabs() {
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.qty, 0));
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: TAB_BAR_STYLE,
        tabBarActiveTintColor: C.green,
        tabBarInactiveTintColor: C.darkSoft,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="HomeTab"
        component={HomeStackScreen}
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused }) => <IconHome color={focused ? C.green : C.darkSoft} filled={focused} />,
        }}
      />
      <Tabs.Screen
        name="MapTab"
        component={MapStack}
        options={({ route }) => ({
          title: 'Frigos',
          tabBarIcon: ({ focused }) => <IconMap color={focused ? C.green : C.darkSoft} />,
          tabBarStyle: mapTabBarStyle(route),
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: C.orange,
            color: C.white,
            fontSize: 10,
            fontWeight: '700',
            minWidth: 16,
            height: 16,
            lineHeight: 14,
          },
        })}
      />
      <Tabs.Screen
        name="ScanTab"
        component={ScanDummy}
        options={{
          title: '',
          tabBarButton: () => <CenterScanButton />,
        }}
      />
      <Tabs.Screen
        name="SportTab"
        component={SportStackScreen}
        options={{
          title: 'Sport',
          tabBarIcon: ({ focused }) => <IconDumbbell color={focused ? C.green : C.darkSoft} />,
        }}
      />
      <Tabs.Screen
        name="SocialTab"
        component={SocialStackScreen}
        options={{
          title: 'Social',
          tabBarIcon: ({ focused }) => <IconTrophy color={focused ? C.green : C.darkSoft} />,
        }}
      />
    </Tabs.Navigator>
  );
}
