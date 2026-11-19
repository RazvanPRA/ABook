import {
  bookmarkSchema,
  progressSchema,
  type BookId,
  type Bookmark,
  type Progress,
} from '@/shared/domain';
import { bookKey } from '@/storage';
import { InMemoryKeyValueStore } from '@/storage/testing';
import { createLocalProgressRepository } from '..';
import { BOOK_IDS } from '../../__fixtures__/books';

const [ID, OTHER] = BOOK_IDS as [BookId, BookId];
const NOW = '2026-11-19T10:00:00.000Z';

const progress = (sentence: number): Progress =>
  progressSchema.parse({
    chapter: 1,
    sentence,
    page: 12,
    finished: false,
    updatedAt: NOW,
  });

const bookmark = (id: string): Bookmark =>
  bookmarkSchema.parse({
    id,
    chapter: 0,
    sentence: 4,
    page: 2,
    excerpt: 'Și mai era un băiat…',
    createdAt: NOW,
  });

const setup = (initial = {}) => {
  const kv = new InMemoryKeyValueStore(initial);
  return { kv, repo: createLocalProgressRepository({ kv }) };
};

describe('LocalProgressRepository', () => {
  let warn: jest.SpyInstance;
  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it('round-trips progress per book, the last write winning', async () => {
    const { repo } = setup();
    expect(await repo.getProgress(ID)).toBeNull();
    await repo.saveProgress(ID, progress(3));
    await repo.saveProgress(ID, progress(4));
    expect(await repo.getProgress(ID)).toEqual(progress(4));
    expect(await repo.getProgress(OTHER)).toBeNull();
  });

  it('round-trips bookmarks; none stored is an empty list', async () => {
    const { repo } = setup();
    expect(await repo.getBookmarks(ID)).toEqual([]);
    await repo.saveBookmarks(ID, [bookmark('a'), bookmark('b')]);
    expect(await repo.getBookmarks(ID)).toEqual([bookmark('a'), bookmark('b')]);
    await repo.saveBookmarks(ID, []);
    expect(await repo.getBookmarks(ID)).toEqual([]);
  });

  it('treats corrupt progress and bookmarks as missing, and logs them', async () => {
    const { repo } = setup({
      [bookKey(ID, 'progress')]: '{"chapter":-1}',
      [bookKey(ID, 'bookmarks')]: 'not json',
    });
    expect(await repo.getProgress(ID)).toBeNull();
    expect(await repo.getBookmarks(ID)).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('refuses invalid values without writing', async () => {
    const { kv, repo } = setup();
    const invalid = { ...progress(1), page: 0 } as unknown as Progress;
    await expect(repo.saveProgress(ID, invalid)).rejects.toThrow();
    await expect(
      repo.saveBookmarks(ID, [bookmark('a'), bookmark('a')]),
    ).rejects.toThrow();
    expect(kv.snapshot()).toEqual({});
  });
});
