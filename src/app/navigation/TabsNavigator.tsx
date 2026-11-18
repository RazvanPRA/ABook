import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { LibraryScreen } from '@/features/library';
import { PlayerScreen } from '@/features/player';
import { SettingsScreen } from '@/features/settings';
import type { TabsParamList } from './types';

const Tab = createBottomTabNavigator<TabsParamList>();

// Default tab bar for now; the custom BottomTabBar with icons comes in M1.
export function TabsNavigator() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{ title: t('tabs.library') }}
      />
      <Tab.Screen
        name="Player"
        component={PlayerScreen}
        options={{ title: t('tabs.player') }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('tabs.settings') }}
      />
    </Tab.Navigator>
  );
}
