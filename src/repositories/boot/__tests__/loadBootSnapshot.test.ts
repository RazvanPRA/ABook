import { DEFAULT_SETTINGS, type BookId } from '@/shared/domain';
import { bookKey, rootKey } from '@/storage';
import { InMemoryKeyValueStore } from '@/storage/testing';
import { BOOK_IDS, makeMeta, setupRepository } from '../../__fixtures__/books';
import { loadBootSnapshot } from '../loadBootSnapshot';

const [A, B, C] = BOOK_IDS as [BookId, BookId, BookId];

describe('loadBootSnapshot', () => {
  let warn: jest.SpyInstance;
  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it('reads an empty install as no books and the default settings', async () => {
    const snapshot = await loadBootSnapshot(new InMemoryKeyValueStore());
    expect(snapshot).toEqual({
      books: [],
      settings: DEFAULT_SETTINGS,
      order: [],
      orderValid: true,
      keys: [],
    });
  });

  it('reads the order, every meta and the settings in a single getMany', async () => {
    const { kv, repo } = setupRepository();
    for (const id of [A, B, C]) {
      await repo.createBook(makeMeta(id));
    }
    await kv.setMany({ [bookKey(A, 'progress')]: '{}' });
    kv.calls.length = 0;

    const snapshot = await loadBootSnapshot(kv);
    expect(snapshot.books.map(b => b.id)).toEqual([C, B, A]);
    expect(kv.calls.map(c => c.operation)).toEqual(['getAllKeys', 'getMany']);
    expect(kv.calls[1]?.keys).not.toContain(bookKey(A, 'progress'));
  });

  it('hides a listed book whose meta is corrupt, without dropping it from the order', async () => {
    const { kv, repo } = setupRepository();
    await repo.createBook(makeMeta(A));
    await repo.createBook(makeMeta(B));
    await kv.setMany({ [bookKey(A, 'meta')]: '{"id":1}' });

    const snapshot = await loadBootSnapshot(kv);
    expect(snapshot.books.map(b => b.id)).toEqual([B]);
    expect(snapshot.order).toEqual([B, A]);
  });

  it('ignores a meta stored under another book id', async () => {
    const { kv, repo } = setupRepository();
    await repo.createBook(makeMeta(A));
    await kv.setMany({ [bookKey(A, 'meta')]: JSON.stringify(makeMeta(B)) });
    expect((await loadBootSnapshot(kv)).books).toEqual([]);
  });

  it('rebuilds an unreadable order from the metas, newest first, and flags it', async () => {
    const { kv, repo } = setupRepository();
    await repo.createBook(
      makeMeta(A, { importedAt: '2026-01-01T00:00:00.000Z' }),
    );
    await repo.createBook(
      makeMeta(B, { importedAt: '2026-03-01T00:00:00.000Z' }),
    );
    await kv.setMany({ [rootKey('books')]: 'garbage' });

    const snapshot = await loadBootSnapshot(kv);
    expect(snapshot.orderValid).toBe(false);
    expect(snapshot.order).toEqual([B, A]);
    expect(snapshot.books.map(b => b.id)).toEqual([B, A]);
  });
});
