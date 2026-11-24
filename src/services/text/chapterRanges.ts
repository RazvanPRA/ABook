/** Where a chapter begins: its title (may be empty) and its first page (1-based). */
export interface ChapterStart {
  readonly title: string;
  readonly page: number;
}

/** A chapter's page range, inclusive on both ends. An empty title is named by the UI. */
export interface ChapterRange {
  readonly title: string;
  readonly startPage: number;
  readonly endPage: number;
}

/**
 * Turns chapter starts into contiguous ranges that cover pages 1…`pageCount` exactly. Starts outside
 * the book are ignored; on the same page only the first start counts; starts are sorted by page.
 * Pages before the first start (title page, preface) become a chapter of their own with an empty
 * title. No starts → one chapter for the whole book.
 */
export function rangesFromStarts(
  starts: readonly ChapterStart[],
  pageCount: number,
): ChapterRange[] {
  if (pageCount < 1) {
    return [];
  }
  const usable = uniqueByPage(
    starts.filter(start => start.page >= 1 && start.page <= pageCount),
  );
  if (usable[0]?.page !== 1) {
    usable.unshift({ title: '', page: 1 });
  }
  return usable.map((start, index) => ({
    title: start.title,
    startPage: start.page,
    endPage: (usable[index + 1]?.page ?? pageCount + 1) - 1,
  }));
}

function uniqueByPage(starts: readonly ChapterStart[]): ChapterStart[] {
  const byPage = new Map<number, ChapterStart>();
  for (const start of starts) {
    if (!byPage.has(start.page)) {
      byPage.set(start.page, start);
    }
  }
  return [...byPage.values()].sort((a, b) => a.page - b.page);
}
