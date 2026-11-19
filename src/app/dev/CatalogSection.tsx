import React, { type PropsWithChildren } from 'react';
import { View } from 'react-native';
import { AppText } from '@/shared/ui';
import { styles } from './catalog.styles';

type CatalogSectionProps = PropsWithChildren<{ title: string }>;

/** Overline title + content, like the section titles in the mockups. */
export function CatalogSection({ title, children }: CatalogSectionProps) {
  return (
    <View style={styles.section}>
      <AppText variant="overline" color="textMuted" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}
