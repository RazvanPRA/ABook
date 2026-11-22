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
import {
  createChapterAssembler,
  type ChapterAssembler,
} from './chapterAssembler';
import { createChapterWriter, type ChapterWriter } from './chapterWriter';
import { throwIfCancelled } from './cancellation';
import { isScannedPdf } from './isScannedPdf';
import { planChapters } from './planChapters';
import type { ResumePoint } from './resumePoint';

/** Pages asked for per request (PROMPT §5). */
export const PAGES_PER_BATCH = 5;

/** Progress reaches the store every 10 pages: re-rendering per batch cost time on the emulator. */
export const PROGRESS_EVERY_PAGES = 10;

export interface Extraction {
  readonly bookId: BookId;
  readonly document: PdfDocument;
  readonly outline: readonly OutlineItem[];
  /** Pages already processed and chapters already saved; `START` for a new import. */
  readonly resume: ResumePoint;
}

/**
 * Streams the pages in batches and saves each chapter as soon as its last page is in. The first
 * pages are always read first: they reject a scan and decide the book-wide headers and how
 * chapters are cut, so a resumed import cuts and cleans exactly as an uninterrupted one. Pages up
 * to `resume.fromPage` are not fed again. Returns the table of contents.
 */
export async function extractChapters(
  context: ImportContext,
  extraction: Extraction,
): Promise<readonly Chapter[]> {
  const { bookId, document, outline, resume } = extraction;
  const { pageCount } = document;
  const sample = await readSample(context, pageCount);
  const feed = createFeed({
    assembler: createChapterAssembler(
      planChapters({ outline, pageCount, sample }),
    ),
    writer: createChapterWriter(context, {
      bookId,
      bookHeaders: detectRepeatedHeaders(sample),
      saved: resume.toc,
    }),
    fromPage: resume.fromPage,
  });
  await feed.pages(sample);
  if (resume.fromPage > 0) {
    context.dispatch(pagesExtracted(resume.fromPage));
  }
  const first = Math.max(sample.length, resume.fromPage) + 1;
  for (let from = first; from <= pageCount; from += PAGES_PER_BATCH) {
    const to = Math.min(from + PAGES_PER_BATCH - 1, pageCount);
    await feed.pages(await readPages(context, { from, to, pageCount }));
  }
  throwIfCancelled(context);
  context.dispatch(extractionFinished());
  return feed.finish();
}

interface Feed {
  /** Hands the pages after `fromPage` to the assembler, saving each chapter they complete. */
  pages(pages: readonly PageText[]): Promise<void>;
  /** Saves the chapter still open; returns the table of contents. */
  finish(): Promise<readonly Chapter[]>;
}

function createFeed(parts: {
  assembler: ChapterAssembler;
  writer: ChapterWriter;
  fromPage: number;
}): Feed {
  const { assembler, writer, fromPage } = parts;
  return {
    pages: async pages => {
      for (const page of pages.filter(p => p.page > fromPage)) {
        const draft = assembler.push(page);
        if (draft) {
          await writer.write(draft);
        }
      }
    },
    finish: async () => {
      const last = assembler.finish();
      if (last) {
        await writer.write(last);
      }
      return writer.toc();
    },
  };
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
