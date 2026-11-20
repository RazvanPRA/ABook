import { findChapterHeading, type PageText } from '@/services/text';
import type { ChapterPlan } from './planChapters';

/** A chapter whose pages are all in, not yet cleaned nor segmented. */
export interface ChapterDraft {
  readonly title: string;
  readonly startPage: number;
  readonly endPage: number;
  readonly pages: readonly PageText[];
}

export interface ChapterAssembler {
  /** Adds the next page (pages come in order); returns the chapter it completed, if any. */
  push(page: PageText): ChapterDraft | null;
  /** After the last page: the chapter still open, if it has pages. */
  finish(): ChapterDraft | null;
}

interface Open {
  title: string;
  pages: PageText[];
}

function close(open: Open): ChapterDraft | null {
  const first = open.pages[0];
  const last = open.pages[open.pages.length - 1];
  if (!first || !last) {
    return null;
  }
  return {
    title: open.title,
    startPage: first.page,
    endPage: last.page,
    pages: open.pages,
  };
}

/**
 * Groups streamed pages into chapters, so each chapter is saved as soon as its last page arrives.
 * With ranges, a chapter ends on its range's last page; with headings, a page with a heading ends
 * the chapter before it and opens the next one, titled by the heading.
 */
export function createChapterAssembler(plan: ChapterPlan): ChapterAssembler {
  let open: Open = { title: '', pages: [] };
  const titleAt = (page: PageText): string | null =>
    plan.kind === 'ranges'
      ? (plan.ranges.find(range => range.startPage === page.page)?.title ??
        null)
      : findChapterHeading(page, plan.bodyHeight);
  const endsAt = (page: PageText): boolean =>
    plan.kind === 'ranges' &&
    plan.ranges.some(range => range.endPage === page.page);

  return {
    push: page => {
      const title = titleAt(page);
      let done: ChapterDraft | null = null;
      if (title !== null) {
        done = close(open);
        open = { title, pages: [] };
      }
      open.pages.push(page);
      if (endsAt(page)) {
        done = close(open);
        open = { title: '', pages: [] };
      }
      return done;
    },
    finish: () => close(open),
  };
}
