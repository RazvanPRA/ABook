import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScreenPlaceholder } from '@/shared/ui';

export function LibraryScreen() {
  const { t } = useTranslation();
  return (
    <ScreenPlaceholder title={t('library.title')} testID="screen-library" />
  );
}
