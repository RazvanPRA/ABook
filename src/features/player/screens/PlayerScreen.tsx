import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScreenPlaceholder } from '@/shared/ui';

export function PlayerScreen() {
  const { t } = useTranslation();
  return <ScreenPlaceholder title={t('player.title')} testID="screen-player" />;
}
