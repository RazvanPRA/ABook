import React, { useMemo } from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BottomTabBar, type BottomTabItem, type IconName } from '@/shared/ui';
import type { TabsParamList } from './types';

const TAB_ICONS: Record<keyof TabsParamList, IconName> = {
  Library: 'book',
  Player: 'headphones',
  Settings: 'sliders-horizontal',
};

/** Maps React Navigation's tab bar props onto the navigation-agnostic BottomTabBar. */
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
  return <BottomTabBar items={items} />;
}
