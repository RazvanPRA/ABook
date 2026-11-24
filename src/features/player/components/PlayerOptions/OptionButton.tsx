import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { color, opacity, radius, size, space } from '@/shared/theme';
import { AppText, Icon, type IconName } from '@/shared/ui';

interface OptionButtonProps {
  label: string;
  accessibilityLabel: string;
  icon?: IconName;
  /** Something is set behind it. */
  active?: boolean;
  onPress: () => void;
}

/** One of the three equal buttons under the controls. */
export function OptionButton({
  label,
  accessibilityLabel,
  icon,
  active = false,
  onPress,
}: OptionButtonProps) {
  const tint = active ? 'accent' : 'text';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.base, pressed && styles.pressed]}
    >
      {icon ? <Icon name={icon} color={tint} /> : null}
      <AppText
        variant="bodyStrong"
        color={tint}
        maxFontSizeMultiplier={size.maxFontScaleHeader}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    minHeight: size.buttonLg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingHorizontal: space.sm,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  pressed: { opacity: opacity.pressed },
});
