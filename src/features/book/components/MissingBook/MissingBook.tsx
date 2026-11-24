import React from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/shared/ui';

/** An unknown or malformed id (an old link), or a book deleted meanwhile. */
export function MissingBook({ onLibrary }: { onLibrary: () => void }) {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon="book"
      title={t('book.missing.title')}
      description={t('book.missing.detail')}
      action={{ label: t('book.missing.action'), onPress: onLibrary }}
    />
  );
}
