import { DEFAULT_SETTINGS, toChapterIndex, type BookId } from '@/shared/domain';
import { createLocalBootRepository, type BootRepository } from '@/repositories';
import {
  BOOK_IDS,
  SOURCE_URI,
  makeChunk,
  makeMeta,
  setupRepository,
} from '@/repositories/__fixtures__/books';
import {
  CURRENT_SCHEMA_VERSION,
  bookKey,
  bookPrefix,
  rootKey,
} from '@/storage';
import { bootstrap } from '../bootstrap';

const [A, B, C] = BOOK_IDS as [BookId, BookId, BookId];

/** A library over fakes, plus a boot repository over the same stores. */
const library = async (ids: BookId[]) => {
  const setup = setupRepository();
  for (const [i, id] of ids.entries()) {
    await setup.repo.storePdf(id, SOURCE_URI);
    // Distinct import dates, so an order rebuilt from the metas is deterministic
    const importedAt = `2026-0${i + 1}-01T00:00:00.000Z`;
    await setup.repo.createBook(makeMeta(id, { importedAt }));
    await setup.repo.saveChapter(id, toChapterIndex(0), makeChunk(3));
    await setup.repo.updateMeta(id, { status: 'ready', processedPages: 120 });
  }
  return { ...setup, boot: createLocalBootRepository(setup) };
};

const keysOf = (snapshot: Record<string, string>, id: BookId) =>
  Object.keys(snapshot).filter(key => key.startsWith(bookPrefix(id)));

describe('bootstrap', () => {
  let warn: jest.SpyInstance;
  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it('starts an empty install with no books, defaults and the current schema', async () => {
    const { kv, boot } = await library([]);
    expect(await bootstrap(boot)).toEqual({
      books: [],
      settings: DEFAULT_SETTINGS,
    });
    expect(kv.snapshot()[rootKey('schemaVersion')]).toBe(
      String(CURRENT_SCHEMA_VERSION),
    );
  });

  it('hydrates three books in library order with the saved settings', async () => {
    const { kv, boot } = await library([A, B, C]);
    const settings = { ...DEFAULT_SETTINGS, defaultRate: 1.5 };
    await kv.setMany({ [rootKey('settings')]: JSON.stringify(settings) });
    const result = await bootstrap(boot);
    expect(result.books.map(b => b.id)).toEqual([C, B, A]);
    expect(result.settings).toEqual(settings);
  });

  it('reads the library with a single getMany once migrations are current', async () => {
    const { kv, boot } = await library([A, B]);
    await bootstrap(boot);
    kv.calls.length = 0;
    await bootstrap(boot);
    const reads = kv.calls.filter(c => c.operation === 'getMany');
    expect(reads).toHaveLength(2); // schema version + the snapshot
  });

  it('marks a book left processing without its PDF as failed, in memory and in storage', async () => {
    const { kv, repo, boot } = await library([A]);
    await repo.createBook(makeMeta(B)); // its file is gone: nothing to resume from
    const result = await bootstrap(boot);
    expect(result.books.map(b => [b.id, b.status])).toEqual([
      [B, 'failed'],
      [A, 'ready'],
    ]);
    expect(JSON.parse(kv.snapshot()[bookKey(B, 'meta')] ?? '{}')).toMatchObject(
      { status: 'failed', failure: 'missing-file' },
    );
  });

  it('keeps a book left processing with its PDF as processing, to be resumed', async () => {
    const { kv, repo, boot } = await library([A]);
    const stored = await repo.storePdf(B, SOURCE_URI);
    await repo.createBook(makeMeta(B, { fileUri: stored.path }));
    const result = await bootstrap(boot);
    expect(result.books.map(b => [b.id, b.status])).toEqual([
      [B, 'processing'],
      [A, 'ready'],
    ]);
    expect(JSON.parse(kv.snapshot()[bookKey(B, 'meta')] ?? '{}').status).toBe(
      'processing',
    );
  });

  it('sweeps keys and PDFs of books missing from the library, and nothing else', async () => {
    const { kv, files, repo, boot } = await library([A, B]);
    kv.failNext('removeMany');
    await expect(repo.deleteBook(A)).rejects.toThrow(); // delete interrupted after step 1
    await repo.storePdf(C, SOURCE_URI); // import interrupted before the meta
    files.addFile(`${files.booksDir()}/notes.txt`, 10);
    const bKeys = keysOf(kv.snapshot(), B);

    await bootstrap(boot);
    expect(keysOf(kv.snapshot(), A)).toEqual([]);
    expect(keysOf(kv.snapshot(), B)).toEqual(bKeys);
    expect(await files.list(files.booksDir())).toEqual(
      expect.arrayContaining([`${B}.pdf`, 'notes.txt']),
    );
    expect(await files.list(files.booksDir())).toHaveLength(2);
  });

  it('keeps the other books when one meta is corrupt, and keeps its data', async () => {
    const { kv, boot } = await library([A, B]);
    await kv.setMany({ [bookKey(A, 'meta')]: 'nope' });
    const result = await bootstrap(boot);
    expect(result.books.map(b => b.id)).toEqual([B]);
    expect(keysOf(kv.snapshot(), A).length).toBeGreaterThan(0);
  });

  it('repairs an unreadable order and sweeps nothing during that boot', async () => {
    const { kv, repo, boot } = await library([A, B]);
    await kv.setMany({ [rootKey('books')]: '["broken"' });
    const bookKeys = () => [A, B].flatMap(id => keysOf(kv.snapshot(), id));
    const before = bookKeys();
    expect((await bootstrap(boot)).books).toHaveLength(2);
    expect(bookKeys()).toEqual(before);

    await repo.createBook(makeMeta(C)); // must not orphan A and B on the next boot
    expect((await bootstrap(boot)).books.map(b => b.id)).toEqual([C, B, A]);
  });

  describe('failure policy', () => {
    const failing = (
      base: BootRepository,
      stage: keyof BootRepository,
    ): BootRepository => ({
      ...base,
      [stage]: () => Promise.reject(new Error(`${stage} broke`)),
    });

    it('starts empty with defaults when the snapshot cannot be read', async () => {
      const { boot } = await library([A]);
      expect(await bootstrap(failing(boot, 'loadSnapshot'))).toEqual({
        books: [],
        settings: DEFAULT_SETTINGS,
      });
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('snapshot'),
        expect.any(Error),
      );
    });

    it.each([
      'migrate',
      'repairOrder',
      'failUnresumableImports',
      'sweepOrphans',
    ] as const)('still hydrates the library when %s fails', async stage => {
      const { boot } = await library([A, B]);
      const result = await bootstrap(failing(boot, stage));
      expect(result.books.map(b => b.id)).toEqual([B, A]);
    });
  });
});
