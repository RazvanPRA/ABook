import React, { memo } from 'react';
import { Pressable } from 'react-native';
import { size } from '@/shared/theme';
import { AppText } from '../AppText';
import { feedback } from '../feedback.styles';
import { Icon } from '../Icon';
import { styles } from './BottomTabBar.styles';
import type { BottomTabItem } from './BottomTabBar.types';

type BottomTabBarItemProps = Omit<BottomTabItem, 'key'>;

export const BottomTabBarItem = memo(function BottomTabBarItemView({
  label,
  icon,
  focused,
  onPress,
}: BottomTabBarItemProps) {
  const tint = focused ? 'accent' : 'textMuted';
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && feedback.pressed]}
    >
      <Icon name={icon} size="lg" color={tint} />
      <AppText
        variant="caption"
        color={tint}
        maxFontSizeMultiplier={size.maxFontScaleHeader}
      >
        {label}
      </AppText>
    </Pressable>
  );
});
