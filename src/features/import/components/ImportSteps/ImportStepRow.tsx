import React, { memo } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, ProgressBar } from '@/shared/ui';
import type { ImportStep, StepStatus } from '../../model/types';
import { styles } from './ImportSteps.styles';
import { StepIndicator } from './StepIndicator';
import { useStepText } from './useStepText';

const TITLE_LOOK = {
  done: { variant: 'body', color: 'text' },
  active: { variant: 'bodyStrong', color: 'text' },
  waiting: { variant: 'body', color: 'textMuted' },
  error: { variant: 'bodyStrong', color: 'danger' },
} as const satisfies Record<StepStatus, object>;

/** One step of "Procesare locală", read as one element: name, status and page progress. */
export const ImportStepRow = memo(function StepRow({
  step,
}: {
  step: ImportStep;
}) {
  const { t } = useTranslation();
  const text = useStepText(step);
  const look = TITLE_LOOK[step.status];
  return (
    <View
      accessible
      accessibilityLabel={text.accessibilityLabel}
      style={styles.row}
    >
      <StepIndicator status={step.status} />
      <View style={styles.text}>
        <View style={styles.titleLine}>
          <AppText
            variant={look.variant}
            color={look.color}
            style={styles.title}
          >
            {text.title}
          </AppText>
          {text.page ? (
            <AppText variant="caption" color="textMuted">
              {text.page}
            </AppText>
          ) : null}
        </View>
        {text.detail ? (
          <AppText variant="caption" color="textMuted">
            {text.detail}
          </AppText>
        ) : null}
        {step.progress ? (
          <ProgressBar
            value={
              step.progress.total === 0
                ? 0
                : step.progress.page / step.progress.total
            }
            accessibilityLabel={t('import.steps.progressLabel')}
          />
        ) : null}
      </View>
    </View>
  );
});
