import {
  chapterChunkSchema,
  chapterEntrySchema,
  chapterPartsManifestSchema,
  chapterSchema,
  tocSchema,
} from '../schemas';
import { rawChapter } from '../__fixtures__/rawValues';

describe('chapterSchema', () => {
  it.each([
    ['a regular chapter', {}],
    ['a one-page chapter', { startPage: 5, endPage: 5 }],
    ['an untitled chapter', { title: '' }],
  ])('accepts %s', (_case, overrides) => {
    expect(chapterSchema.safeParse(rawChapter(overrides)).success).toBe(true);
  });

  it.each([
    ['page 0', { startPage: 0 }],
    ['start after end', { startPage: 31 }],
    ['a negative index', { index: -1 }],
    ['a fractional sentence count', { sentenceCount: 2.5 }],
  ])('rejects %s', (_case, overrides) => {
    expect(chapterSchema.safeParse(rawChapter(overrides)).success).toBe(false);
  });
});

describe('tocSchema', () => {
  const second = rawChapter({ index: 1, startPage: 31, endPage: 60 });

  it('accepts consecutive indexes and an empty toc', () => {
    expect(tocSchema.safeParse([rawChapter(), second]).success).toBe(true);
    expect(tocSchema.safeParse([]).success).toBe(true);
  });

  it.each([
    ['out of order', [second, rawChapter()]],
    ['with a gap', [rawChapter(), rawChapter({ index: 2 })]],
    ['not starting at 0', [second]],
  ])('rejects indexes %s', (_case, toc) => {
    expect(tocSchema.safeParse(toc).success).toBe(false);
  });
});

describe('chapterChunkSchema', () => {
  it('accepts aligned sentences and pages, including an empty chunk', () => {
    const chunk = {
      sentences: ['Ion merge.', 'Ana citește.'],
      sentencePages: [1, 2],
    };
    expect(chapterChunkSchema.safeParse(chunk).success).toBe(true);
    expect(
      chapterChunkSchema.safeParse({ sentences: [], sentencePages: [] })
        .success,
    ).toBe(true);
  });

  it.each([
    [
      'fewer pages than sentences',
      { sentences: ['a', 'b'], sentencePages: [1] },
    ],
    ['page 0', { sentences: ['a'], sentencePages: [0] }],
    ['a non-string sentence', { sentences: [1], sentencePages: [1] }],
  ])('rejects %s', (_case, chunk) => {
    expect(chapterChunkSchema.safeParse(chunk).success).toBe(false);
  });
});

describe('chapterEntrySchema', () => {
  it('accepts either a chunk or a parts manifest', () => {
    expect(
      chapterEntrySchema.safeParse({ sentences: ['a'], sentencePages: [3] })
        .success,
    ).toBe(true);
    expect(chapterEntrySchema.safeParse({ parts: 3 }).success).toBe(true);
  });

  it.each([[{ parts: 1 }], [{ parts: 0 }], [{ parts: 2.5 }], [{}]])(
    'rejects %j',
    entry => {
      expect(chapterEntrySchema.safeParse(entry).success).toBe(false);
    },
  );

  it('keeps the manifest a separate shape from a chunk', () => {
    expect(
      chapterPartsManifestSchema.safeParse({ sentences: [], sentencePages: [] })
        .success,
    ).toBe(false);
  });
});
