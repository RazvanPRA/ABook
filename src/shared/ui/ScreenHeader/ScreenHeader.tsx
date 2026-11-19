import React from 'react';
import { View } from 'react-native';
import { size } from '@/shared/theme';
import { AppText } from '../AppText';
import { IconButton } from '../IconButton';
import { styles } from './ScreenHeader.styles';
import type { ScreenHeaderProps } from './ScreenHeader.types';
import { useScreenHeader } from './useScreenHeader';

export function ScreenHeader({
  title,
  variant = 'large',
  overline,
  back,
  right,
}: ScreenHeaderProps) {
  const safeTop = useScreenHeader();
  if (variant === 'large') {
    return (
      <View style={[styles.root, safeTop]}>
        <AppText
          variant="display"
          accessibilityRole="header"
          style={styles.largeTitle}
        >
          {title}
        </AppText>
        {right}
      </View>
    );
  }
  return (
    <View style={[styles.root, safeTop]}>
      <View style={styles.side}>{back ? <IconButton {...back} /> : null}</View>
      <View style={styles.center}>
        {overline ? (
          <AppText variant="caption" color="textMuted" numberOfLines={1}>
            {overline}
          </AppText>
        ) : null}
        <AppText
          variant="bodyStrong"
          accessibilityRole="header"
          maxFontSizeMultiplier={size.maxFontScaleHeader}
          numberOfLines={1}
        >
          {title}
        </AppText>
      </View>
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}
