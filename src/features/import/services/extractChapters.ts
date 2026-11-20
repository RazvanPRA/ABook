import type { PdfDocument } from '@/services/pdf';
import {
  HEADER_SAMPLE_PAGES,
  detectRepeatedHeaders,
  type OutlineItem,
  type PageText,
} from '@/services/text';
import type { BookId, Chapter } from '@/shared/domain';
import type { ImportContext } from '../model/dependencies';
import { ImportError } from '../model/errors';
import { extractionFinished, pagesExtracted } from '../state/importSlice';
import { createChapterAssembler } from './chapterAssembler';
import { createChapterWriter } from './chapterWriter';
import { isScannedPdf } from './isScannedPdf';
import { planChapters } from './planChapters';

/** Pages asked for per request (PROMPT §5). */
export const PAGES_PER_BATCH = 5;

/** Progress reaches the store every 10 pages: re-rendering per batch cost time on the emulator. */
export const PROGRESS_EVERY_PAGES = 10;

export interface Extraction {
  readonly bookId: BookId;
  readonly document: PdfDocument;
  readonly outline: readonly OutlineItem[];
}

/**
 * Streams the pages in batches and saves each chapter as soon as its last page is in. The first
 * pages are read first: they reject a scan and decide the book-wide headers and how chapters are
 * cut. Returns the table of contents.
 */
export async function extractChapters(
  context: ImportContext,
  { bookId, document, outline }: Extraction,
): Promise<readonly Chapter[]> {
  const { pageCount } = document;
  const sample = await readSample(context, pageCount);
  const assembler = createChapterAssembler(
    planChapters({ outline, pageCount, sample }),
  );
  const writer = createChapterWriter(
    context,
    bookId,
    detectRepeatedHeaders(sample),
  );
  const feed = async (pages: readonly PageText[]) => {
    for (const page of pages) {
      const draft = assembler.push(page);
      if (draft) {
        await writer.write(draft);
      }
    }
  };
  await feed(sample);
  for (
    let from = sample.length + 1;
    from <= pageCount;
    from += PAGES_PER_BATCH
  ) {
    const to = Math.min(from + PAGES_PER_BATCH - 1, pageCount);
    await feed(await readPages(context, { from, to, pageCount }));
  }
  context.dispatch(extractionFinished());
  const last = assembler.finish();
  if (last) {
    await writer.write(last);
  }
  return writer.toc();
}

/** The first 20 pages; fails a document without pages (`corrupt`) or without text (`scanned`). */
async function readSample(
  context: ImportContext,
  pageCount: number,
): Promise<PageText[]> {
  if (pageCount === 0) {
    throw new ImportError('corrupt', 'the PDF has no pages');
  }
  const to = Math.min(HEADER_SAMPLE_PAGES, pageCount);
  const sample = await readPages(context, { from: 1, to, pageCount });
  if (isScannedPdf(sample)) {
    throw new ImportError('scanned', 'the first pages have no text');
  }
  return sample;
}

/** Pages `from`–`to` in batches of 5, with progress every 10 pages and at the last page. */
async function readPages(
  context: ImportContext,
  range: { from: number; to: number; pageCount: number },
): Promise<PageText[]> {
  const pages: PageText[] = [];
  for (let from = range.from; from <= range.to; from += PAGES_PER_BATCH) {
    const to = Math.min(from + PAGES_PER_BATCH - 1, range.to);
    pages.push(...(await context.pdfExtractor.getPages(from, to)));
    if (to % PROGRESS_EVERY_PAGES === 0 || to === range.pageCount) {
      context.dispatch(pagesExtracted(to));
    }
  }
  return pages;
}
