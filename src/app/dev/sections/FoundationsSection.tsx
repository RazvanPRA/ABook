import React from 'react';
import { View } from 'react-native';
import { AppText, Icon, icons, type IconName } from '@/shared/ui';
import { styles } from '../catalog.styles';
import { CatalogSection } from '../CatalogSection';

const VARIANTS = [
  'display',
  'title',
  'body',
  'bodyStrong',
  'caption',
  'overline',
] as const;
const ICON_NAMES = Object.keys(icons) as IconName[];

export function FoundationsSection() {
  return (
    <CatalogSection title="Tipografie și iconițe">
      {VARIANTS.map(variant => (
        <AppText key={variant} variant={variant}>
          {variant} · Amintiri din copilărie
        </AppText>
      ))}
      <AppText color="textMuted">textMuted · text secundar</AppText>
      <AppText color="textRead">textRead · frază deja citită</AppText>
      <View style={styles.row}>
        {ICON_NAMES.map(name => (
          <Icon key={name} name={name} size="lg" />
        ))}
      </View>
    </CatalogSection>
  );
}
