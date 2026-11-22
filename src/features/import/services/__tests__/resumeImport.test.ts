import type { FakePdf } from '@/services/pdf/testing';
import { toChapterIndex, toPageNumber, type BookMeta } from '@/shared/domain';
import {
  BOOK,
  PICKED,
  STORED,
  book,
  createImportContext,
} from '../../__fixtures__/importSetup';
import type { MemoryBookRepository } from '../../__fixtures__/memoryBookRepository';
import { formChanged } from '../../state/importSlice';
import { resumeImport } from '../resumeImport';
import { resumePoint, START } from '../resumePoint';
import { runImport } from '../runImport';

const OUTLINE = [
  { title: 'Capitolul 1', page: 1, items: [] },
  { title: 'Capitolul 2', page: 11, items: [] },
  { title: 'Capitolul 3', page: 26, items: [] },
  { title: 'Capitolul 4', page: 41, items: [] },
];

const PDFS: readonly [string, FakePdf][] = [
  ['outline', { pages: book(60), outline: OUTLINE }],
  ['every 10 pages', { pages: book(60) }],
  [
    'headings',
    {
      pages: book(60, {
        1: 'Capitolul I',
        9: 'Capitolul II',
        17: 'Capitolul III',
        33: 'Capitolul IV',
      }),
    },
  ],
];

/** What a finished import leaves in storage for the book. */
const stored = (repo: MemoryBookRepository) => ({
  meta: repo.metas.get(BOOK),
  toc: repo.tocs.get(BOOK),
  chapters: [...repo.chapters.entries()].sort(([a], [b]) => a.localeCompare(b)),
  files: [...repo.files],
  order: repo.order,
});

async function uninterrupted(pdf: FakePdf) {
  const { repo, extractor, context, store } = createImportContext();
  extractor.addPdf(STORED, pdf);
  store.dispatch(formChanged({ field: 'author', value: 'L. Rebreanu' }));
  await runImport(context, PICKED);
  return repo;
}

/** An import killed (no cleanup runs) right after chapter `chapters` was saved. */
async function killedAfter(pdf: FakePdf, chapters: number) {
  const { repo, extractor, context, store, yieldToJs } = createImportContext();
  extractor.addPdf(STORED, pdf);
  store.dispatch(formChanged({ field: 'author', value: 'L. Rebreanu' }));
  for (let i = 1; i < chapters; i += 1) {
    yieldToJs.mockImplementationOnce(async () => undefined);
  }
  yieldToJs.mockImplementationOnce(() => Promise.reject(new Error('killed')));
  await expect(runImport(context, PICKED)).rejects.toThrow('killed');
  return repo;
}

/** The relaunch: a fresh store and extractor over what the killed import stored. */
async function relaunch(repo: MemoryBookRepository, pdf: FakePdf) {
  const next = createImportContext(repo);
  next.extractor.addPdf(STORED, pdf);
  const before = repo.calls.length;
  const meta = (await repo.getMeta(BOOK)) as BookMeta;
  await resumeImport(next.context, meta);
  return { ...next, calls: repo.calls.slice(before) };
}

describe('resumeImport', () => {
  it.each(PDFS)(
    'continues after chapter 2 and ends as an uninterrupted import (%s)',
    async (_, pdf) => {
      const expected = stored(await uninterrupted(pdf));
      const repo = await killedAfter(pdf, 2);
      expect(repo.metas.get(BOOK)?.status).toBe('processing');

      const { calls, store } = await relaunch(repo, pdf);
      expect(stored(repo)).toEqual(expected);
      const saved = calls.flatMap(c => (c.op === 'saveChapter' ? c.index : []));
      expect(saved[0]).toBe(2);
      expect(store.getState().import).toMatchObject({
        phase: { type: 'ready' },
        chaptersSaved: expected.toc?.length,
      });
    },
  );

  it('reads the first 20 pages again, then only the pages after the saved chapters', async () => {
    const [, pdf] = PDFS[1] as [string, FakePdf];
    const repo = await killedAfter(pdf, 4); // pages 1–40 processed
    const { extractor } = await relaunch(repo, pdf);
    const ranges = extractor.calls.flatMap(c =>
      c.call === 'getPages' ? [c.args] : [],
    );
    expect(ranges).toEqual([
      [1, 5],
      [6, 10],
      [11, 15],
      [16, 20],
      [41, 45],
      [46, 50],
      [51, 55],
      [56, 60],
    ]);
  });

  it('continues from the toc when the kill came before processedPages was written', async () => {
    const [, pdf] = PDFS[0] as [string, FakePdf];
    const expected = stored(await uninterrupted(pdf));
    const { repo, extractor, context } = createImportContext();
    extractor.addPdf(STORED, pdf);
    const updateMeta = repo.updateMeta.bind(repo);
    jest.spyOn(repo, 'updateMeta').mockImplementation(async (id, patch) => {
      if (patch.processedPages === 25) {
        throw new Error('killed');
      }
      return updateMeta(id, patch);
    });
    await expect(runImport(context, PICKED)).rejects.toThrow('killed');
    jest.restoreAllMocks();
    expect(repo.metas.get(BOOK)?.processedPages).toBe(10);

    const { calls } = await relaunch(repo, pdf);
    expect(calls.find(c => c.op === 'saveChapter')).toMatchObject({ index: 2 });
    expect(stored(repo).toc).toEqual(expected.toc);
  });

  it('finishes a book killed after its last chapter without reading past the sample', async () => {
    const [, pdf] = PDFS[1] as [string, FakePdf];
    const repo = await killedAfter(pdf, 6);
    const { calls, extractor } = await relaunch(repo, pdf);
    expect(calls.map(c => c.op)).toEqual(['updateMeta', 'updateMeta']);
    expect(repo.metas.get(BOOK)).toMatchObject({
      status: 'ready',
      chapterCount: 6,
    });
    expect(extractor.calls.filter(c => c.call === 'getPages')).toHaveLength(4);
  });
});

describe('resumePoint', () => {
  const chapter = (index: number, endPage: number) => ({
    index: toChapterIndex(index),
    title: '',
    startPage: toPageNumber(1),
    endPage: toPageNumber(endPage),
    sentenceCount: 1,
  });

  it('continues after the later of processedPages and the last toc chapter', () => {
    const toc = [chapter(0, 10), chapter(1, 25)];
    expect(resumePoint({ processedPages: 25 }, toc)).toEqual({
      fromPage: 25,
      toc,
    });
    expect(resumePoint({ processedPages: 10 }, toc).fromPage).toBe(25);
    expect(resumePoint({ processedPages: 30 }, toc).fromPage).toBe(30); // empty chapter skipped
    expect(resumePoint({ processedPages: 0 }, []).fromPage).toBe(0);
  });

  it('restarts from page 1 without a toc', () => {
    expect(resumePoint({ processedPages: 25 }, null)).toBe(START);
  });
});
