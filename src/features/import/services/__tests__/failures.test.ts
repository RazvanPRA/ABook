import { PdfExtractionError } from '@/services/pdf';
import type { PageText } from '@/services/text';
import {
  BOOK,
  STORED,
  book,
  createImportContext,
} from '../../__fixtures__/importSetup';
import { ImportCancelledError, ImportError } from '../../model/errors';
import { importCancelled } from '../../state/importSlice';
import { failureReason } from '../failureReason';
import { isScannedPdf } from '../isScannedPdf';
import { runImport } from '../runImport';

const PICKED = { name: 'a.pdf', uri: 'content://a', sizeBytes: 10 };

const page = (n: number, text: string): PageText => ({
  page: n,
  lines: text ? [{ text, y: 0.5, height: 11 }] : [],
});

describe('isScannedPdf', () => {
  it('is true when each of the first 5 pages has fewer than 20 characters', () => {
    const pages = [1, 2, 3, 4, 5].map(n => page(n, `  ${'x'.repeat(19)}  `));
    expect(isScannedPdf(pages)).toBe(true);
    expect(isScannedPdf([page(1, '')])).toBe(true);
  });

  it('is false when one of the first 5 pages has 20 characters; later pages do not count', () => {
    const pages = [1, 2, 3, 4, 5].map(n =>
      page(n, n === 4 ? 'x'.repeat(20) : ''),
    );
    expect(isScannedPdf(pages)).toBe(false);
    const late = [
      ...[1, 2, 3, 4, 5].map(n => page(n, '')),
      page(6, 'x'.repeat(99)),
    ];
    expect(isScannedPdf(late)).toBe(true);
    expect(isScannedPdf([])).toBe(false);
  });
});

describe('failureReason', () => {
  it('keeps the pipeline’s own reason', () => {
    expect(failureReason(new ImportError('scanned', 'x'), 'extracting')).toBe(
      'scanned',
    );
  });

  it.each([
    ['password', 'password'],
    ['corrupt', 'corrupt'],
    ['timeout', 'timeout'],
    ['boot', 'unknown'],
    ['protocol', 'unknown'],
  ] as const)('maps pdf.js %s to %s', (code, reason) => {
    expect(failureReason(new PdfExtractionError(code, 'x'), 'opening')).toBe(
      reason,
    );
  });

  it('blames the copy while copying, storage afterwards', () => {
    expect(failureReason(new Error('ENOSPC'), 'copying')).toBe('copy');
    expect(failureReason(new Error('SQLITE_FULL'), 'extracting')).toBe(
      'storage',
    );
  });
});

describe('cancellation between steps', () => {
  it('stops before the next chapter once cancelled, never ending ready', async () => {
    const { store, repo, extractor, context, yieldToJs } =
      createImportContext();
    extractor.addPdf(STORED, { pages: book(30) });
    yieldToJs.mockImplementationOnce(async () => {
      store.dispatch(importCancelled());
    });
    await expect(runImport(context, PICKED)).rejects.toBeInstanceOf(
      ImportCancelledError,
    );
    expect(repo.calls.filter(call => call.op === 'saveChapter')).toHaveLength(
      1,
    );
    expect(repo.calls.filter(call => call.op === 'saveToc')).toHaveLength(1);
    expect(repo.metas.get(BOOK)?.status).toBe('processing');
  });

  it('stops before the ready meta when cancelled after the last chapter', async () => {
    const { store, repo, extractor, context, yieldToJs } =
      createImportContext();
    extractor.addPdf(STORED, { pages: book(5) });
    yieldToJs.mockImplementationOnce(async () => {
      store.dispatch(importCancelled());
    });
    await expect(runImport(context, PICKED)).rejects.toBeInstanceOf(
      ImportCancelledError,
    );
    expect(repo.calls.at(-1)).toEqual({
      op: 'updateMeta',
      patch: { processedPages: 5 },
    });
    expect(repo.metas.get(BOOK)?.status).toBe('processing');
  });

  it('stops right after the copy when cancelled while copying', async () => {
    const { store, repo, context } = createImportContext();
    const storePdf = repo.storePdf.bind(repo);
    jest.spyOn(repo, 'storePdf').mockImplementation(async (id, uri) => {
      const stored = await storePdf(id, uri);
      store.dispatch(importCancelled());
      return stored;
    });
    await expect(runImport(context, PICKED)).rejects.toBeInstanceOf(
      ImportCancelledError,
    );
    expect(repo.calls.map(call => call.op)).toEqual(['storePdf']);
  });
});
