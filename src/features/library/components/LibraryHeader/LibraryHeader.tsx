import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton, ScreenHeader } from '@/shared/ui';

interface LibraryHeaderProps {
  /** Without it there is no settings button (the empty library, as in the mockup). */
  onSettings?: () => void;
}

export function LibraryHeader({ onSettings }: LibraryHeaderProps) {
  const { t } = useTranslation();
  return (
    <ScreenHeader
      title={t('library.title')}
      right={
        onSettings ? (
          <IconButton
            icon="settings"
            accessibilityLabel={t('library.settings')}
            onPress={onSettings}
          />
        ) : undefined
      }
    />
  );
}
