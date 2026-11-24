/** Raw (unparsed) sample values, as they would come out of JSON.parse. */
export const BOOK_ID = '0b6f2f4e-7c1a-4d8e-9f3a-2a5b6c7d8e9f';
export const NOW = '2026-11-19T10:00:00.000Z';

export const rawMeta = (overrides: Record<string, unknown> = {}) => ({
  id: BOOK_ID,
  title: 'Amintiri din copilărie',
  author: 'Ion Creangă',
  language: 'ro-RO',
  fileUri: 'file:///data/books/x.pdf',
  fileSizeBytes: 1_200_000,
  pageCount: 120,
  chapterCount: 4,
  sentenceCount: 2400,
  status: 'ready',
  processedPages: 120,
  importedAt: NOW,
  coverColor: 'cover-sample',
  fingerprint: null,
  failure: null,
  ...overrides,
});

export const rawChapter = (overrides: Record<string, unknown> = {}) => ({
  index: 0,
  title: 'Partea I',
  startPage: 1,
  endPage: 30,
  sentenceCount: 600,
  ...overrides,
});
