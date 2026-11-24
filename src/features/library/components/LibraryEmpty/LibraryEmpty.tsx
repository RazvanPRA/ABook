import React from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/shared/ui';

/** The library without books (mockup 01). */
export function LibraryEmpty({ onImport }: { onImport: () => void }) {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon="file-headphone"
      title={t('library.empty.title')}
      description={t('library.empty.detail')}
      action={{
        label: t('library.empty.action'),
        icon: 'plus',
        onPress: onImport,
      }}
      note={t('library.empty.note')}
    />
  );
}
