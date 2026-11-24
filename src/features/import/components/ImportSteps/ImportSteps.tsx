import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppText, Card } from '@/shared/ui';
import type { ImportStep } from '../../model/types';
import { ImportStepRow } from './ImportStepRow';
import { View } from 'react-native';
import { styles } from './ImportSteps.styles';

/** "Procesare locală": the four steps of the import, as the mockup lists them. */
export function ImportSteps({ steps }: { steps: readonly ImportStep[] }) {
  const { t } = useTranslation();
  return (
    <Card>
      <View style={styles.card}>
        <AppText
          variant="overline"
          color="textMuted"
          accessibilityRole="header"
        >
          {t('import.steps.title')}
        </AppText>
        {steps.map(step => (
          <ImportStepRow key={step.id} step={step} />
        ))}
      </View>
    </Card>
  );
}
