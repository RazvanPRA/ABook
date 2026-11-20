import { bookUpserted } from '@/features/library';
import type { PdfDocument } from '@/services/pdf';
import {
  HEADER_SAMPLE_PAGES,
  detectRepeatedHeaders,
  type OutlineItem,
  type PageText,
} from '@/services/text';
import type { BookId, BookMeta } from '@/shared/domain';
import { pickCoverColor } from '@/shared/theme';
import type { ImportContext } from '../model/dependencies';
import type { PickedFile } from '../model/types';
import {
  documentOpened,
  extractionFinished,
  fileCopied,
  importFinished,
  importStarted,
  pagesExtracted,
  savingStarted,
} from '../state/importSlice';
import { createChapterAssembler } from './chapterAssembler';
import { createChapterWriter } from './chapterWriter';
import { formPatch } from './formPatch';
import { planChapters } from './planChapters';

/** Pages asked for per request (PROMPT §5). */
export const PAGES_PER_BATCH = 5;

/** Progress reaches the store every 10 pages: re-rendering per batch cost time on the emulator. */
export const PROGRESS_EVERY_PAGES = 10;

/**
 * The whole import of a picked PDF, in the storage write order: file → `meta` (`processing`) →
 * each chapter as it completes (+ `processedPages`) → `toc` → `meta` (`ready`). Returns the id.
 */
export async function runImport(
  context: ImportContext,
  file: PickedFile,
): Promise<BookId> {
  const bookId = context.newBookId();
  context.dispatch(importStarted({ bookId, file }));
  const path = await createProcessingBook(context, bookId, file);
  const { document, outline } = await openDocument(context, { bookId, path });
  const toc = await extractChapters(context, { bookId, document, outline });
  context.dispatch(savingStarted());
  await context.bookRepository.saveToc(bookId, toc);
  const meta = await context.bookRepository.updateMeta(bookId, {
    ...formPatch(context.getForm()),
    status: 'ready',
    processedPages: document.pageCount,
    chapterCount: toc.length,
    sentenceCount: toc.reduce((sum, chapter) => sum + chapter.sentenceCount, 0),
  });
  if (meta) {
    context.dispatch(bookUpserted(meta));
  }
  context.dispatch(importFinished());
  return bookId;
}

/**
 * Copies the file and writes the `processing` meta; the book shows in the library from here.
 * Returns the path of the app's copy.
 */
async function createProcessingBook(
  context: ImportContext,
  bookId: BookId,
  file: PickedFile,
): Promise<string> {
  const stored = await context.bookRepository.storePdf(bookId, file.uri);
  const { title, language } = context.getForm();
  const meta: BookMeta = {
    id: bookId,
    title,
    author: '',
    language,
    fileUri: stored.path,
    fileSizeBytes: stored.sizeBytes,
    pageCount: 0,
    chapterCount: 0,
    sentenceCount: 0,
    status: 'processing',
    processedPages: 0,
    importedAt: context.now().toISOString(),
    coverColor: pickCoverColor(bookId),
  };
  await context.bookRepository.createBook(meta);
  context.dispatch(bookUpserted(meta));
  context.dispatch(fileCopied());
  return stored.path;
}

/** Opens the copy, prefills the form from its metadata and records the page count. */
async function openDocument(
  context: ImportContext,
  { bookId, path }: { bookId: BookId; path: string },
): Promise<{ document: PdfDocument; outline: OutlineItem[] }> {
  const { bookRepository, pdfExtractor } = context;
  const document = await pdfExtractor.open(path);
  const outline = await pdfExtractor.getOutline();
  const { pageCount, info } = document;
  context.dispatch(documentOpened({ pageCount, ...info }));
  const meta = await bookRepository.updateMeta(bookId, {
    ...formPatch(context.getForm()),
    pageCount,
  });
  if (meta) {
    context.dispatch(bookUpserted(meta));
  }
  return { document, outline };
}

interface Extraction {
  readonly bookId: BookId;
  readonly document: PdfDocument;
  readonly outline: readonly OutlineItem[];
}

/**
 * Streams the pages in batches and saves each chapter as soon as its last page is in. The first
 * pages are read first: they decide the book-wide headers and how chapters are cut.
 */
async function extractChapters(
  context: ImportContext,
  { bookId, document, outline }: Extraction,
) {
  const { pageCount } = document;
  const sampleEnd = Math.min(HEADER_SAMPLE_PAGES, pageCount);
  const sample = await readPages(context, {
    from: 1,
    to: sampleEnd,
    pageCount,
  });
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
  for (let from = sampleEnd + 1; from <= pageCount; from += PAGES_PER_BATCH) {
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
