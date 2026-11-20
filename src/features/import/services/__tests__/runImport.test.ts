import { selectBookById } from '@/features/library';
import { toChapterIndex } from '@/shared/domain';
import {
  BOOK,
  PICKED,
  STORED,
  book,
  createImportContext,
} from '../../__fixtures__/importSetup';
import { formChanged } from '../../state/importSlice';
import { selectCanListen, selectImportSteps } from '../../state/selectors';
import { runImport } from '../runImport';

const OUTLINE = [
  { title: 'Capitolul 1', page: 1, items: [] },
  { title: 'Capitolul 2', page: 11, items: [] },
  { title: 'Capitolul 3', page: 26, items: [] },
];

describe('runImport', () => {
  it('writes in the storage order: file, processing meta, chapters as they complete, toc, ready', async () => {
    const { repo, extractor, context } = createImportContext();
    extractor.addPdf(STORED, { pages: book(30), outline: OUTLINE });

    await expect(runImport(context, PICKED)).resolves.toBe(BOOK);

    expect(repo.calls.map(call => call.op)).toEqual([
      'storePdf',
      'createBook',
      'updateMeta', // page count + form
      'saveChapter',
      'updateMeta', // processedPages 10
      'saveChapter',
      'updateMeta', // 25
      'saveChapter',
      'updateMeta', // 30
      'saveToc',
      'updateMeta', // ready
    ]);
    expect(repo.calls[1]).toEqual({ op: 'createBook', status: 'processing' });
    expect(
      repo.calls
        .filter(call => call.op === 'updateMeta')
        .map(call => call.op === 'updateMeta' && call.patch.processedPages),
    ).toEqual([undefined, 10, 25, 30, 30]);
    expect(repo.calls.at(-1)).toMatchObject({
      patch: { status: 'ready', chapterCount: 3, sentenceCount: 60 },
    });
  });

  it('saves a table of contents with the outline titles and page ranges', async () => {
    const { repo, extractor, context } = createImportContext();
    extractor.addPdf(STORED, { pages: book(30), outline: OUTLINE });
    await runImport(context, PICKED);
    expect(await repo.getToc(BOOK)).toEqual([
      {
        index: 0,
        title: 'Capitolul 1',
        startPage: 1,
        endPage: 10,
        sentenceCount: 20,
      },
      {
        index: 1,
        title: 'Capitolul 2',
        startPage: 11,
        endPage: 25,
        sentenceCount: 30,
      },
      {
        index: 2,
        title: 'Capitolul 3',
        startPage: 26,
        endPage: 30,
        sentenceCount: 10,
      },
    ]);
  });

  it('saves clean sentences with their pages: no running title, no page number', async () => {
    const { repo, extractor, context } = createImportContext();
    extractor.addPdf(STORED, { pages: book(30), outline: OUTLINE });
    await runImport(context, PICKED);
    const chapter = await repo.getChapter(BOOK, toChapterIndex(1));
    expect(chapter?.sentences.slice(0, 2)).toEqual([
      'Ion a mers pe drum la pagina 11.',
      'Ana privea câmpul de pe pagina 11.',
    ]);
    expect(chapter?.sentencePages.slice(0, 3)).toEqual([11, 11, 12]);
    expect(chapter?.sentences.join(' ')).not.toContain('roman de test');
  });

  it('cuts chapters at the headings when there is no outline', async () => {
    const { repo, extractor, context } = createImportContext();
    const pages = book(24, {
      1: 'Capitolul I',
      9: 'Capitolul II',
      22: 'Capitolul III',
    });
    extractor.addPdf(STORED, { pages });
    await runImport(context, PICKED);
    const toc = await repo.getToc(BOOK);
    expect(toc?.map(c => [c.title, c.startPage, c.endPage])).toEqual([
      ['Capitolul I', 1, 8],
      ['Capitolul II', 9, 21],
      ['Capitolul III', 22, 24],
    ]);
    const first = await repo.getChapter(BOOK, toChapterIndex(0));
    expect(first?.sentences[0]).toBe('Capitolul I');
  });

  it('cuts a chapter every 10 pages without outline nor headings', async () => {
    const { repo, extractor, context } = createImportContext();
    extractor.addPdf(STORED, { pages: book(25) });
    await runImport(context, PICKED);
    const toc = await repo.getToc(BOOK);
    expect(toc?.map(c => [c.startPage, c.endPage])).toEqual([
      [1, 10],
      [11, 20],
      [21, 25],
    ]);
  });

  it('skips a chapter with no text, keeping chapter indexes contiguous', async () => {
    const { repo, extractor, context } = createImportContext();
    const pages = book(30).map(page =>
      page.page <= 10 ? { page: page.page, lines: [] } : page,
    );
    extractor.addPdf(STORED, { pages, outline: OUTLINE });
    await runImport(context, PICKED);
    const toc = await repo.getToc(BOOK);
    expect(toc?.map(c => [c.index, c.title])).toEqual([
      [0, 'Capitolul 2'],
      [1, 'Capitolul 3'],
    ]);
    expect(await repo.getMeta(BOOK)).toMatchObject({ processedPages: 30 });
  });

  it('yields to the JS thread after each chapter', async () => {
    const { extractor, context, yieldToJs } = createImportContext();
    extractor.addPdf(STORED, { pages: book(30), outline: OUTLINE });
    await runImport(context, PICKED);
    expect(yieldToJs).toHaveBeenCalledTimes(3);
  });
});

describe('runImport while it runs', () => {
  it('makes the first chapter readable, and the book visible, before extraction ends', async () => {
    const { store, repo, extractor, context } = createImportContext();
    extractor.addPdf(STORED, { pages: book(30), outline: OUTLINE });
    extractor.pauseAtPage(26);
    const running = runImport(context, PICKED);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(await repo.getChapter(BOOK, toChapterIndex(0))).not.toBeNull();
    expect(selectCanListen(store.getState())).toBe(true);
    expect(selectBookById(store.getState(), BOOK)).toMatchObject({
      status: 'processing',
      processedPages: 25,
    });
    expect(selectImportSteps(store.getState())[1]).toMatchObject({
      status: 'active',
      progress: { page: 20, total: 30 },
    });

    extractor.resume();
    await running;
    expect(store.getState().import.phase).toEqual({ type: 'ready' });
    expect(selectBookById(store.getState(), BOOK)).toMatchObject({
      status: 'ready',
      processedPages: 30,
    });
  });

  it('prefills the form from the PDF and keeps what the user types meanwhile', async () => {
    const { store, repo, extractor, context } = createImportContext();
    extractor.addPdf(STORED, {
      pages: book(30),
      outline: OUTLINE,
      title: 'Ion',
      author: 'Liviu Rebreanu',
    });
    extractor.pauseAtPage(26);
    const running = runImport(context, PICKED);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(store.getState().import.form).toMatchObject({
      title: 'Ion',
      author: 'Liviu Rebreanu',
    });
    expect(await repo.getMeta(BOOK)).toMatchObject({
      title: 'Ion',
      pageCount: 30,
    });

    store.dispatch(formChanged({ field: 'title', value: '  Ion (ediția 2) ' }));
    extractor.resume();
    await running;
    expect(await repo.getMeta(BOOK)).toMatchObject({
      title: 'Ion (ediția 2)',
      author: 'Liviu Rebreanu',
      language: 'ro-RO',
    });
  });

  it('keeps the file-name title when the user clears the title field', async () => {
    const { store, repo, extractor, context } = createImportContext();
    extractor.addPdf(STORED, { pages: book(5) });
    store.dispatch(formChanged({ field: 'title', value: ' ' }));
    await runImport(context, PICKED);
    expect(await repo.getMeta(BOOK)).toMatchObject({ title: 'ion-rebreanu' });
  });
});
