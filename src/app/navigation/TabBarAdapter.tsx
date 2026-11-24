import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { MiniPlayer, selectPlayerHasBook } from '@/features/player';
import { BottomTabBar, type BottomTabItem, type IconName } from '@/shared/ui';
import type { TabsParamList } from './types';

const TAB_ICONS: Record<keyof TabsParamList, IconName> = {
  Library: 'book',
  Player: 'headphones',
  Settings: 'sliders-horizontal',
};

/**
 * Maps React Navigation's tab bar props onto the navigation-agnostic BottomTabBar. The player with a
 * book takes the whole tab; on the other tabs it is the mini-player above the bar.
 */
export function TabBarAdapter({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const items = useMemo<BottomTabItem[]>(
    () =>
      state.routes.map((route, index) => {
        const focused = state.index === index;
        return {
          key: route.key,
          label: descriptors[route.key]?.options.title ?? route.name,
          icon: TAB_ICONS[route.name as keyof TabsParamList],
          focused,
          onPress: () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          },
        };
      }),
    [state, descriptors, navigation],
  );
  const hasBook = useSelector(selectPlayerHasBook);
  const onPlayer = state.routes[state.index]?.name === 'Player';
  const openPlayer = useCallback(
    () => navigation.navigate('Player'),
    [navigation],
  );
  if (onPlayer && hasBook) {
    return null;
  }
  return (
    <View>
      {onPlayer ? null : <MiniPlayer onOpen={openPlayer} />}
      <BottomTabBar items={items} />
    </View>
  );
}
