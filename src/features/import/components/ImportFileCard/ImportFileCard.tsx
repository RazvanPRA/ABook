import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Card } from '@/shared/ui';
import { formatBytes, romanianPlural } from '@/shared/utils';
import type { PickedFile } from '../../model/types';
import { useByteUnits } from '@/shared/i18n';
import { styles } from './ImportFileCard.styles';

interface ImportFileCardProps {
  file: PickedFile;
  /** 0 until the PDF is open. */
  pageCount: number;
  onChange: () => void;
}

/** The picked file: name, size and pages, and "Schimbă" to pick another one. */
export function ImportFileCard({
  file,
  pageCount,
  onChange,
}: ImportFileCardProps) {
  const { t } = useTranslation();
  const units = useByteUnits();
  const meta = [formatBytes(file.sizeBytes, units)];
  if (pageCount > 0) {
    meta.push(
      t(`format.pages.${romanianPlural(pageCount)}`, { count: pageCount }),
    );
  }
  return (
    <Card>
      <View style={styles.row}>
        <View
          style={styles.badge}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <AppText variant="caption" color="accent">
            {t('import.file.badge')}
          </AppText>
        </View>
        <View style={styles.text}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {file.name}
          </AppText>
          <AppText variant="caption" color="textMuted">
            {meta.join(' · ')}
          </AppText>
        </View>
        <Button
          label={t('import.file.change')}
          variant="ghost"
          onPress={onChange}
        />
      </View>
    </Card>
  );
}
