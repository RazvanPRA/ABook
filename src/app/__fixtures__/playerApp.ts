import { bookUpserted, loadLibraryProgress } from '@/features/library';
import { SOURCE_SIZE, SOURCE_URI } from '@/repositories/__fixtures__/books';
import { EN_VOICE, RO_VOICE } from '@/services/tts/testing';
import {
  chapterChunkSchema,
  tocSchema,
  toChapterIndex,
  type BookId,
  type BookMeta,
  type ChapterChunk,
  type Progress,
} from '@/shared/domain';
import { BOOK_IDS, makeMeta } from '@/shared/domain/__fixtures__/books';
import { fakeApp } from './fakeApp';

export const [A, B] = BOOK_IDS as [BookId, BookId];

/** Three chapters of four sentences; two sentences on a page. */
export const CHAPTERS = 3;
export const SENTENCES = 4;
export const PAGES = (CHAPTERS * SENTENCES) / 2;

export const sentence = (chapter: number, index: number) =>
  `Fraza ${index + 1} din capitolul ${chapter + 1}.`;

export const pageOf = (chapter: number, index: number) =>
  chapter * (SENTENCES / 2) + Math.floor(index / 2) + 1;

const indexes = Array.from({ length: SENTENCES }, (_, i) => i);

export const chapterText = (chapter: number): ChapterChunk =>
  chapterChunkSchema.parse({
    sentences: indexes.map(i => sentence(chapter, i)),
    sentencePages: indexes.map(i => pageOf(chapter, i)),
  });

export const makeToc = (count = CHAPTERS) =>
  tocSchema.parse(
    Array.from({ length: count }, (_, index) => ({
      index,
      title: index === 2 ? '' : `Partea ${index + 1}`,
      startPage: pageOf(index, 0),
      endPage: pageOf(index, SENTENCES - 1),
      sentenceCount: SENTENCES,
    })),
  );

interface GivenBook {
  id?: BookId;
  meta?: Partial<BookMeta>;
  progress?: Progress;
  /** Saved chapters. */
  chapters?: number;
}

/** Lets storage and the voices answer. */
export const settle = async (): Promise<void> => {
  for (let i = 0; i < 60; i += 1) {
    await Promise.resolve();
  }
};

/** The app's store over in-memory storage and a fake voice, with a book ready to be played. */
export async function playerApp(...books: GivenBook[]) {
  const app = fakeApp();
  app.tts.voices = [RO_VOICE, EN_VOICE];
  app.files.addFile(SOURCE_URI, SOURCE_SIZE);
  const { bookRepository, progressRepository } = app.services;

  const saveChapters = async (id: BookId, count: number) => {
    for (let chapter = 0; chapter < count; chapter += 1) {
      const index = toChapterIndex(chapter);
      await bookRepository.saveChapter(id, index, chapterText(chapter));
    }
    await bookRepository.saveToc(id, makeToc(count));
  };
  for (const { id = A, meta, progress, chapters = CHAPTERS } of books) {
    const { path } = await bookRepository.storePdf(id, SOURCE_URI);
    const book = makeMeta(id, {
      status: 'ready',
      pageCount: PAGES,
      processedPages: PAGES,
      fileUri: path,
      ...meta,
    });
    await bookRepository.createBook({ ...book, status: 'processing' });
    await bookRepository.updateMeta(id, book);
    await saveChapters(id, chapters);
    if (progress) {
      await progressRepository.saveProgress(id, progress);
    }
    app.store.dispatch(bookUpserted(book));
  }
  await app.store.dispatch(loadLibraryProgress());
  return {
    ...app,
    saveChapters,
    session: () => app.store.getState().player.session,
    stored: (id: BookId = A) => progressRepository.getProgress(id),
    keysOf: (id: BookId = A) =>
      Object.entries(app.kv.snapshot())
        .filter(([key, value]) => key.includes(id) || value.includes(id))
        .map(([key]) => key),
  };
}
