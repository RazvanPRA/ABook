import React from 'react';
import { useTranslation } from 'react-i18next';
import { isRetryableFailure, type BookMeta } from '@/shared/domain';
import { useBookImport } from '../../hooks/useBookImport';
import type { BookContent } from '../../state/contentSlice';
import { BookBanner } from '../BookBanner';

interface FailedBannerProps {
  book: BookMeta;
  content: BookContent;
}

/** Why the import failed, and a retry when it may work: an unknown reason, with the PDF in place. */
export function FailedBanner({ book, content }: FailedBannerProps) {
  const { t } = useTranslation();
  const { busy, resume } = useBookImport(book);
  const lines = [t(`book.failed.reasons.${book.failure ?? 'unknown'}`)];
  if (content.toc.length > 0) {
    lines.push(t('book.failed.kept'));
  }
  const retryable = isRetryableFailure(book) && content.hasPdf;
  return (
    <BookBanner
      title={t('book.failed.title')}
      tone="danger"
      lines={lines}
      action={
        retryable
          ? { label: t('book.failed.retry'), onPress: resume, disabled: busy }
          : undefined
      }
    />
  );
}
