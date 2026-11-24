import React, { useMemo } from 'react';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
  type BottomTabScreenProps,
} from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LibraryScreen, type LibraryScreenProps } from '@/features/library';
import { SettingsScreen } from '@/features/settings';
import { PlayerRoute } from './PlayerRoute';
import { TabBarAdapter } from './TabBarAdapter';
import type { TabsParamList } from './types';

const Tab = createBottomTabNavigator<TabsParamList>();

/** Features get navigation as callbacks, not as navigation types. */
function LibraryRoute({
  navigation,
}: BottomTabScreenProps<TabsParamList, 'Library'>) {
  const root = useNavigation();
  const actions = useMemo<LibraryScreenProps>(
    () => ({
      onImport: () => root.navigate('Import'),
      onSettings: () => navigation.navigate('Settings'),
      onOpenBook: id => root.navigate('Book', { id }),
      onPlay: () => navigation.navigate('Player'),
    }),
    [navigation, root],
  );
  return <LibraryScreen {...actions} />;
}

const renderTabBar = (props: BottomTabBarProps) => <TabBarAdapter {...props} />;

export function TabsNavigator() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      backBehavior="history"
      tabBar={renderTabBar}
    >
      <Tab.Screen
        name="Library"
        component={LibraryRoute}
        options={{ title: t('tabs.library') }}
      />
      <Tab.Screen
        name="Player"
        component={PlayerRoute}
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
