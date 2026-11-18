import React from 'react';
import { useTranslation } from 'react-i18next';
import type { BookId } from '@/shared/domain';
import { ScreenPlaceholder } from '@/shared/ui';

export interface BookScreenProps {
  bookId: BookId;
}

/** The navigator passes the route param in; the feature does not depend on navigation types. */
export function BookScreen({ bookId }: BookScreenProps) {
  const { t } = useTranslation();
  return (
    <ScreenPlaceholder
      title={t('book.title')}
      detail={bookId}
      testID="screen-book"
    />
  );
}
