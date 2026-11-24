import {
  toChapterIndex,
  toPageNumber,
  type BookId,
  type Chapter,
} from '@/shared/domain';
import { FINGERPRINT_HEAD_BYTES, pdfFingerprint } from '@/shared/utils';
import { bookKey, chapterKey, rootKey } from '@/storage';
import {
  BOOK_IDS,
  SOURCE_SIZE,
  SOURCE_URI,
  makeChunk,
  makeMeta,
  setupRepository,
} from '../../__fixtures__/books';

const [ID, OTHER] = BOOK_IDS as [BookId, BookId];
const CH0 = toChapterIndex(0);
const CH1 = toChapterIndex(1);

const toc = (id: BookId): Chapter[] =>
  [0, 1].map(index => ({
    index: toChapterIndex(index),
    title: `Partea ${index + 1}`,
    startPage: toPageNumber(index * 10 + 1),
    endPage: toPageNumber(index * 10 + 10),
    sentenceCount: id === ID ? 3 : 0,
  }));

/** Runs the import sequence the M3 pipeline will follow; stops early when a write fails. */
const runImport = async (setup: ReturnType<typeof setupRepository>) => {
  const { repo } = setup;
  const stored = await repo.storePdf(ID, SOURCE_URI);
  await repo.createBook(
    makeMeta(ID, { fileUri: stored.path, fileSizeBytes: stored.sizeBytes }),
  );
  await repo.saveChapter(ID, CH0, makeChunk(3));
  await repo.saveChapter(ID, CH1, makeChunk(5000));
  await repo.saveToc(ID, toc(ID));
  await repo.updateMeta(ID, { status: 'ready', processedPages: 120 });
};

describe('LocalBookRepository – import flow', () => {
  it('copies the PDF into books/{id}.pdf and reports its size and fingerprint', async () => {
    const { repo, files } = setupRepository();
    const stored = await repo.storePdf(ID, SOURCE_URI);
    const head = new Uint8Array(Math.min(SOURCE_SIZE, FINGERPRINT_HEAD_BYTES));
    expect(stored).toEqual({
      path: files.bookPdfPath(ID),
      sizeBytes: SOURCE_SIZE,
      fingerprint: pdfFingerprint(SOURCE_SIZE, head),
    });
    await expect(repo.storePdf(OTHER, '/cache/missing.pdf')).rejects.toThrow();
  });

  it('fingerprints the same file the same way, and a different head differently', async () => {
    const { repo, files } = setupRepository();
    const content = Uint8Array.from({ length: 70_000 }, (_, i) => i % 256);
    files.addFile('/cache/a.pdf', content);
    files.addFile('/cache/b.pdf', content);
    const changed = content.slice();
    changed[100] = 7;
    files.addFile('/cache/c.pdf', changed);
    const [a, b, c] = await Promise.all(
      ['a', 'b', 'c'].map((name, i) =>
        repo.storePdf(BOOK_IDS[i] as BookId, `/cache/${name}.pdf`),
      ),
    );
    expect(a?.fingerprint).toBe(b?.fingerprint);
    expect(c?.fingerprint).not.toBe(a?.fingerprint);
  });

  it('writes file → meta (processing) → chunks → toc → meta (ready)', async () => {
    const setup = setupRepository();
    await runImport(setup);
    expect(setup.files.calls.map(c => c.operation)).toEqual([
      'ensureDir',
      'copy',
    ]);
    const batches = setup.kv.calls
      .filter(c => c.operation === 'setMany' && c.keys.length > 0)
      .map(c => c.keys);
    expect(batches).toEqual([
      [bookKey(ID, 'meta'), rootKey('books')],
      [chapterKey(ID, CH0)],
      [chapterKey(ID, CH1), ...[0, 1].map(k => chapterKey(ID, CH1, k))],
      [bookKey(ID, 'toc')],
      [bookKey(ID, 'meta')],
    ]);
    expect((await setup.repo.getMeta(ID))?.status).toBe('ready');
  });

  it('leaves a processing book with readable chapters after a crash mid-import', async () => {
    const setup = setupRepository();
    setup.kv.failNext('setMany', { skip: 2 }); // meta and chapter 0 succeed, chapter 1 fails
    await expect(runImport(setup)).rejects.toThrow(/Simulated/);

    const { repo } = setup;
    expect((await repo.listBooks()).map(b => [b.id, b.status])).toEqual([
      [ID, 'processing'],
    ]);
    expect(await repo.getChapter(ID, CH0)).toEqual(makeChunk(3));
    expect(await repo.getChapter(ID, CH1)).toBeNull();
    expect(await repo.getToc(ID)).toBeNull();
  });

  it('round-trips an oversized chapter and the toc', async () => {
    const setup = setupRepository();
    await runImport(setup);
    expect(await setup.repo.getChapter(ID, CH1)).toEqual(makeChunk(5000));
    expect(await setup.repo.getToc(ID)).toEqual(toc(ID));
  });

  it('puts new books first, once, and refuses a book that is not processing', async () => {
    const { repo } = setupRepository();
    await repo.createBook(makeMeta(ID));
    await repo.createBook(makeMeta(OTHER));
    await repo.createBook(makeMeta(ID));
    expect((await repo.listBooks()).map(b => b.id)).toEqual([ID, OTHER]);
    await expect(
      repo.createBook(makeMeta(OTHER, { status: 'ready' })),
    ).rejects.toThrow(/processing/);
  });

  it('merges meta patches, validates them and keeps the id', async () => {
    const { repo } = setupRepository();
    expect(await repo.updateMeta(ID, { title: 'X' })).toBeNull();
    await repo.createBook(makeMeta(ID));
    const updated = await repo.updateMeta(ID, {
      processedPages: 60,
      title: 'Nou',
    });
    expect(updated).toMatchObject({ id: ID, processedPages: 60, title: 'Nou' });
    expect(await repo.getMeta(ID)).toEqual(updated);
    await expect(
      repo.updateMeta(ID, { processedPages: 999 }),
    ).rejects.toThrow();
    expect((await repo.getMeta(ID))?.processedPages).toBe(60);
  });
});
