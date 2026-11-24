import { useTranslation } from 'react-i18next';
import type { ColorToken } from '@/shared/theme';
import type { ProgressTone } from '@/shared/ui';
import type { BookWithProgress } from '../../model/types';
import { bookListStatus } from '../../services/bookListStatus';
import { listenedPercent } from '../../services/listenedPercent';

interface RowStatus {
  text: string;
  color: ColorToken;
  /** 0…1; no bar without it. */
  bar?: { value: number; tone: ProgressTone };
}

/** The status line and bar of a row: the import while it runs or failed, the listening otherwise. */
function useRowStatus(item: BookWithProgress): RowStatus {
  const { t } = useTranslation();
  const { book, progress } = item;
  switch (bookListStatus(item)) {
    case 'failed':
      return { text: t('library.status.failed'), color: 'danger' };
    case 'processing':
      return book.pageCount === 0
        ? { text: t('library.status.preparing'), color: 'textMuted' }
        : {
            text: t('library.status.importing', {
              page: book.processedPages,
              total: book.pageCount,
            }),
            color: 'textMuted',
            bar: { value: book.processedPages / book.pageCount, tone: 'info' },
          };
    case 'unstarted':
      return { text: t('library.status.unstarted'), color: 'textMuted' };
    case 'finished':
      return {
        text: t('library.status.finished'),
        color: 'success',
        bar: { value: 1, tone: 'success' },
      };
    case 'reading': {
      const percent = listenedPercent(book, progress);
      return {
        text: t('library.status.listened', { percent }),
        color: 'textMuted',
        bar: { value: percent / 100, tone: 'accent' },
      };
    }
  }
}

/** What a row shows, and the whole of it as one label for screen readers. */
export function useBookListItem(item: BookWithProgress) {
  const { t } = useTranslation();
  const status = useRowStatus(item);
  const { title, author: stored } = item.book;
  const author = stored === '' ? t('library.unknownAuthor') : stored;
  return {
    title,
    author,
    status,
    label: [title, author, status.text].join(', '),
  };
}
