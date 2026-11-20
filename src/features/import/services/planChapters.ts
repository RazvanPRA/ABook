import {
  chaptersFromOutline,
  findChapterHeading,
  fixedPageChapters,
  medianLineHeight,
  type ChapterRange,
  type OutlineItem,
  type PageText,
} from '@/services/text';

/**
 * How the book is cut into chapters, chosen once when the first pages are in (and again the same
 * way on resume): page ranges known up front (outline, or every 10 pages), or chapter headings
 * found while the pages stream in.
 */
export type ChapterPlan =
  | { readonly kind: 'ranges'; readonly ranges: readonly ChapterRange[] }
  | { readonly kind: 'headings'; readonly bodyHeight: number };

export interface PlanInput {
  readonly outline: readonly OutlineItem[];
  readonly pageCount: number;
  /** The first pages (the header sample), raw. */
  readonly sample: readonly PageText[];
}

/** The outline if it describes chapters; else headings if the sample has one; else every 10 pages. */
export function planChapters({
  outline,
  pageCount,
  sample,
}: PlanInput): ChapterPlan {
  const fromOutline = chaptersFromOutline(outline, pageCount);
  if (fromOutline) {
    return { kind: 'ranges', ranges: fromOutline };
  }
  const bodyHeight = medianLineHeight(sample);
  const hasHeading = sample.some(
    page => findChapterHeading(page, bodyHeight) !== null,
  );
  return hasHeading
    ? { kind: 'headings', bodyHeight }
    : { kind: 'ranges', ranges: fixedPageChapters(pageCount) };
}
