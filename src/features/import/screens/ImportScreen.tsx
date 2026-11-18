import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScreenPlaceholder } from '@/shared/ui';

export function ImportScreen() {
  const { t } = useTranslation();
  return <ScreenPlaceholder title={t('import.title')} testID="screen-import" />;
}
