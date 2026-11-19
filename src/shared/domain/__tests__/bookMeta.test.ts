import { bookMetaSchema, bookOrderSchema } from '../schemas';
import { BOOK_ID, rawMeta } from '../__fixtures__/rawValues';

describe('bookMetaSchema', () => {
  it('accepts a complete ready book', () => {
    expect(bookMetaSchema.safeParse(rawMeta()).success).toBe(true);
  });

  it.each([
    [
      'processing with unknown page count',
      { status: 'processing', pageCount: 0, processedPages: 0 },
    ],
    ['failed half-way', { status: 'failed', processedPages: 60 }],
    ['english, no author', { language: 'en-US', author: '' }],
  ])('accepts %s', (_case, overrides) => {
    expect(bookMetaSchema.safeParse(rawMeta(overrides)).success).toBe(true);
  });

  it.each([
    ['a non-UUID id', { id: 'book-1' }],
    ['an empty title', { title: '' }],
    ['an unknown language', { language: 'fr-FR' }],
    ['an unknown status', { status: 'importing' }],
    ['a negative size', { fileSizeBytes: -1 }],
    ['a fractional page count', { pageCount: 1.5 }],
    ['more processed pages than pages', { processedPages: 121 }],
    ['a non-ISO date', { importedAt: '19.11.2026' }],
    ['a missing field', { coverColor: undefined }],
    ['a wrong type', { chapterCount: '4' }],
  ])('rejects %s', (_case, overrides) => {
    expect(bookMetaSchema.safeParse(rawMeta(overrides)).success).toBe(false);
  });

  it('produces the branded id unchanged', () => {
    expect(bookMetaSchema.parse(rawMeta()).id).toBe(BOOK_ID);
  });
});

describe('bookOrderSchema', () => {
  const other = '1c7a3e5f-8b2d-4c6e-9a1f-3b4c5d6e7f80';

  it.each([[[]], [[BOOK_ID]], [[BOOK_ID, other]]])('accepts %j', ids => {
    expect(bookOrderSchema.safeParse(ids).success).toBe(true);
  });

  it.each([
    ['duplicates', [BOOK_ID, BOOK_ID]],
    ['a non-UUID', ['abc']],
    ['a non-array', BOOK_ID],
  ])('rejects %s', (_case, value) => {
    expect(bookOrderSchema.safeParse(value).success).toBe(false);
  });
});
