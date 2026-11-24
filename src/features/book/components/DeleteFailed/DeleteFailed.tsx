import React from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/shared/ui';

/** The delete failed twice: what is left can only be deleted again. */
export function DeleteFailed({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon="trash"
      title={t('book.delete.failedTitle')}
      description={t('book.delete.failedDetail')}
      action={{ label: t('book.delete.retry'), onPress: onRetry }}
    />
  );
}
