import React from 'react';
import { useTranslation } from 'react-i18next';
import type { BookMeta } from '@/shared/domain';
import { ProgressBar } from '@/shared/ui';
import { romanianPlural } from '@/shared/utils';
import { useBookImport } from '../../hooks/useBookImport';
import { BookBanner } from '../BookBanner';

interface ImportBannerProps {
  book: BookMeta;
  savedChapters: number;
}

/** A `processing` book: its import runs, or it stopped and can be continued. */
export function ImportBanner({ book, savedChapters }: ImportBannerProps) {
  const { t } = useTranslation();
  const { running, busy, page, resume } = useBookImport(book);
  const total = book.pageCount;
  const saved = t(`book.chapters.saved.${romanianPlural(savedChapters)}`, {
    count: savedChapters,
  });
  if (!running) {
    return (
      <BookBanner
        title={t('book.import.stalled')}
        lines={[
          page === 0
            ? t('book.import.stalledEarly')
            : t('book.import.stalledDetail', { page, total }),
          saved,
        ]}
        action={{
          label: t('book.import.resume'),
          onPress: resume,
          disabled: busy,
        }}
      />
    );
  }
  return (
    <BookBanner
      title={t('book.import.running')}
      lines={[
        total === 0
          ? t('book.import.preparing')
          : t('book.import.page', { page, total }),
        saved,
      ]}
    >
      <ProgressBar
        value={total === 0 ? 0 : page / total}
        tone="info"
        accessibilityLabel={t('book.import.progress')}
      />
    </BookBanner>
  );
}
