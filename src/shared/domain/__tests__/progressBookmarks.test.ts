import { bookmarksSchema, progressSchema } from '../schemas';
import { NOW } from '../__fixtures__/rawValues';

const rawProgress = (overrides: Record<string, unknown> = {}) => ({
  chapter: 2,
  sentence: 41,
  page: 34,
  finished: false,
  updatedAt: NOW,
  ...overrides,
});

const rawBookmark = (overrides: Record<string, unknown> = {}) => ({
  id: 'bm-1',
  chapter: 0,
  sentence: 0,
  page: 1,
  excerpt: 'Stau câteodată și-mi aduc aminte…',
  createdAt: NOW,
  ...overrides,
});

describe('progressSchema', () => {
  it('accepts the start of a book and a finished book', () => {
    expect(
      progressSchema.safeParse(
        rawProgress({ chapter: 0, sentence: 0, page: 1 }),
      ).success,
    ).toBe(true);
    expect(
      progressSchema.safeParse(rawProgress({ finished: true })).success,
    ).toBe(true);
  });

  it.each([
    ['page 0', { page: 0 }],
    ['a negative sentence', { sentence: -1 }],
    ['a missing date', { updatedAt: undefined }],
    ['a date without time', { updatedAt: '2026-11-19' }],
  ])('rejects %s', (_case, overrides) => {
    expect(progressSchema.safeParse(rawProgress(overrides)).success).toBe(
      false,
    );
  });
});

describe('bookmarksSchema', () => {
  it('accepts an empty list and distinct ids', () => {
    expect(bookmarksSchema.safeParse([]).success).toBe(true);
    expect(
      bookmarksSchema.safeParse([rawBookmark(), rawBookmark({ id: 'bm-2' })])
        .success,
    ).toBe(true);
  });

  it.each([
    ['duplicate ids', [rawBookmark(), rawBookmark()]],
    ['an empty id', [rawBookmark({ id: '' })]],
    ['page 0', [rawBookmark({ page: 0 })]],
  ])('rejects %s', (_case, list) => {
    expect(bookmarksSchema.safeParse(list).success).toBe(false);
  });
});
