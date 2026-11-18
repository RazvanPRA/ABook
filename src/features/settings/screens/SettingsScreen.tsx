import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScreenPlaceholder } from '@/shared/ui';

export function SettingsScreen() {
  const { t } = useTranslation();
  return (
    <ScreenPlaceholder title={t('settings.title')} testID="screen-settings" />
  );
}
