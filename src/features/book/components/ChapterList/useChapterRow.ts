import { useTranslation } from 'react-i18next';
import type { Chapter } from '@/shared/domain';
import type { ColorToken } from '@/shared/theme';
import type { IconName, ListRowTone } from '@/shared/ui';
import { chapterTitle } from '../../services/chapterTitle';
import type { ChapterStatus } from '../../services/deriveChapterStatus';

interface ChapterLook {
  tone: ListRowTone;
  icon: IconName;
  iconColor: ColorToken;
  pagesColor: ColorToken;
}

/** How each status looks (mockup 03). */
const LOOKS: Record<ChapterStatus, ChapterLook> = {
  done: {
    tone: 'muted',
    icon: 'check',
    iconColor: 'success',
    pagesColor: 'textMuted',
  },
  current: {
    tone: 'active',
    icon: 'headphones',
    iconColor: 'accent',
    pagesColor: 'accent',
  },
  pending: {
    tone: 'default',
    icon: 'circle',
    iconColor: 'textMuted',
    pagesColor: 'textMuted',
  },
};

/** A chapter row's texts and look: "Partea a II-a, paginile 22–43, în curs de ascultare". */
export function useChapterRow(chapter: Chapter, status: ChapterStatus) {
  const { t } = useTranslation();
  const { startPage: from, endPage: to } = chapter;
  const single = from === to;
  const title = chapterTitle(chapter, number =>
    t('book.chapters.untitled', { number }),
  );
  const pagesLabel = single
    ? t('book.chapters.pageLabel', { from })
    : t('book.chapters.pagesLabel', { from, to });
  return {
    title,
    pages: single
      ? t('book.chapters.page', { from })
      : t('book.chapters.pages', { from, to }),
    label: [title, pagesLabel, t(`book.chapters.status.${status}`)].join(', '),
    look: LOOKS[status],
  };
}
