import React from 'react';
import { View } from 'react-native';
import { styles } from './BottomTabBar.styles';
import type { BottomTabBarProps } from './BottomTabBar.types';
import { BottomTabBarItem } from './BottomTabBarItem';
import { useBottomTabBar } from './useBottomTabBar';

/** App tab bar: amber active tab, muted inactive ones, safe area at the bottom. */
export function BottomTabBar({ items }: BottomTabBarProps) {
  const safeBottom = useBottomTabBar();
  return (
    <View accessibilityRole="tablist" style={[styles.bar, safeBottom]}>
      {items.map(({ key, ...item }) => (
        <BottomTabBarItem key={key} {...item} />
      ))}
    </View>
  );
}
