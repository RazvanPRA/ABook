import { toChapterIndex, type BookId } from '@/shared/domain';
import { bookKey, chapterKey, rootKey } from '@/storage';
import { InMemoryKeyValueStore, InMemoryFileStore } from '@/storage/testing';
import { createLocalBookRepository } from '..';
import { BOOK_IDS, makeChunk, makeMeta } from '../../__fixtures__/books';

const [ID, OTHER] = BOOK_IDS as [BookId, BookId];
const CH = toChapterIndex(2);

const repoOver = (kv: InMemoryKeyValueStore) =>
  createLocalBookRepository({ kv, files: new InMemoryFileStore() });

const partsOf = (kv: InMemoryKeyValueStore) =>
  Object.keys(kv.snapshot()).filter(key =>
    key.startsWith(`${chapterKey(ID, CH)}:p:`),
  );

describe('LocalBookRepository – chapter rewrites', () => {
  it.each([
    ['split → whole', 5000, 3, 0],
    ['larger split → smaller split', 9000, 5000, 2],
  ])(
    'removes stale parts (%s)',
    async (_case, before, after, expectedParts) => {
      const kv = new InMemoryKeyValueStore();
      const repo = repoOver(kv);
      await repo.saveChapter(ID, CH, makeChunk(before));
      expect(partsOf(kv).length).toBeGreaterThan(expectedParts);
      await repo.saveChapter(ID, CH, makeChunk(after));
      expect(partsOf(kv)).toHaveLength(expectedParts);
      expect(await repo.getChapter(ID, CH)).toEqual(makeChunk(after));
    },
  );

  it('rejects an invalid chunk before writing anything', async () => {
    const kv = new InMemoryKeyValueStore();
    const bad = { sentences: ['a'], sentencePages: [] };
    await expect(repoOver(kv).saveChapter(ID, CH, bad)).rejects.toThrow();
    expect(kv.snapshot()).toEqual({});
  });
});

describe('LocalBookRepository – corrupt values', () => {
  let warn: jest.SpyInstance;
  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it.each([
    ['meta', bookKey(ID, 'meta'), 'getMeta'],
    ['toc', bookKey(ID, 'toc'), 'getToc'],
  ] as const)(
    'returns null for a corrupt %s and logs it',
    async (_case, key, method) => {
      const repo = repoOver(new InMemoryKeyValueStore({ [key]: '{"broken":' }));
      expect(await repo[method](ID)).toBeNull();
      expect(warn).toHaveBeenCalled();
    },
  );

  it('returns null for a corrupt chunk, a corrupt part or a missing part', async () => {
    const kv = new InMemoryKeyValueStore({ [chapterKey(ID, CH)]: '[]' });
    expect(await repoOver(kv).getChapter(ID, CH)).toBeNull();

    const split = new InMemoryKeyValueStore();
    await repoOver(split).saveChapter(ID, CH, makeChunk(5000));
    await split.setMany({ [chapterKey(ID, CH, 1)]: '{"sentences":3}' });
    expect(await repoOver(split).getChapter(ID, CH)).toBeNull();
    await split.removeMany([chapterKey(ID, CH, 1)]);
    expect(await repoOver(split).getChapter(ID, CH)).toBeNull();
  });

  it('lists the valid books and skips corrupt or missing metas', async () => {
    const kv = new InMemoryKeyValueStore();
    const repo = repoOver(kv);
    await repo.createBook(makeMeta(ID));
    await repo.createBook(makeMeta(OTHER));
    await kv.setMany({ [bookKey(OTHER, 'meta')]: 'nope' });
    expect((await repo.listBooks()).map(b => b.id)).toEqual([ID]);
    await kv.removeMany([bookKey(OTHER, 'meta')]);
    expect((await repo.listBooks()).map(b => b.id)).toEqual([ID]);
  });

  it('treats a corrupt library order as an empty library', async () => {
    const kv = new InMemoryKeyValueStore({ [rootKey('books')]: '["x","x"]' });
    expect(await repoOver(kv).listBooks()).toEqual([]);
  });
});
