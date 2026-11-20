import { bookUpserted } from '@/features/library';
import type { StoredPdf } from '@/repositories';
import type { PdfDocument } from '@/services/pdf';
import type { OutlineItem } from '@/services/text';
import type { BookId, BookMeta } from '@/shared/domain';
import { pickCoverColor } from '@/shared/theme';
import type { ImportContext } from '../model/dependencies';
import type { PickedFile } from '../model/types';
import {
  documentOpened,
  importFinished,
  savingStarted,
} from '../state/importSlice';
import { throwIfCancelled } from './cancellation';
import { copyPdf } from './copyPdf';
import { extractChapters } from './extractChapters';
import { formPatch } from './formPatch';

export interface ImportTarget {
  readonly bookId: BookId;
  readonly stored: StoredPdf;
}

/**
 * Imports a picked PDF: copy and duplicate check, then (unless it is a duplicate, which waits for
 * the user) the book itself. Returns the id, and whether the import waits on a duplicate.
 */
export async function runImport(
  context: ImportContext,
  file: PickedFile,
): Promise<{ bookId: BookId; waitsOnDuplicate: boolean }> {
  const copied = await copyPdf(context, file);
  if (!copied.duplicate) {
    await importBook(context, copied);
  }
  return { bookId: copied.bookId, waitsOnDuplicate: copied.duplicate };
}

/**
 * The book from its copied file, in the storage write order: `meta` (`processing`) → each chapter
 * as it completes (+ `processedPages`) → `toc` → `meta` (`ready`). Also the path of a kept
 * duplicate. Stops with `ImportCancelledError` at the next step after a cancel.
 */
export async function importBook(
  context: ImportContext,
  { bookId, stored }: ImportTarget,
): Promise<void> {
  await createProcessingBook(context, { bookId, stored });
  throwIfCancelled(context);
  const { document, outline } = await openDocument(context, { bookId, stored });
  throwIfCancelled(context);
  const toc = await extractChapters(context, { bookId, document, outline });
  throwIfCancelled(context);
  context.dispatch(savingStarted());
  await context.bookRepository.saveToc(bookId, toc);
  throwIfCancelled(context);
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
}

/** Writes the `processing` meta; the book shows in the library from here. */
async function createProcessingBook(
  context: ImportContext,
  { bookId, stored }: ImportTarget,
): Promise<void> {
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
    fingerprint: stored.fingerprint,
  };
  await context.bookRepository.createBook(meta);
  context.dispatch(bookUpserted(meta));
}

/** Opens the copy, prefills the form from its metadata and records the page count. */
async function openDocument(
  context: ImportContext,
  { bookId, stored }: ImportTarget,
): Promise<{ document: PdfDocument; outline: OutlineItem[] }> {
  const { bookRepository, pdfExtractor } = context;
  const document = await pdfExtractor.open(stored.path);
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
