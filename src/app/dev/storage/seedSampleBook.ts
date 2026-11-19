import { v4 as uuidv4 } from 'uuid';
import {
  bookMetaSchema,
  toBookId,
  toChapterIndex,
  toPageNumber,
  type BookMeta,
  type ChapterChunk,
} from '@/shared/domain';
import { pickCoverColor } from '@/shared/theme';
import type { AppServices } from '../../dependencies';

const SENTENCE =
  'Dimineața, Nică pleca pe furiș la scăldat, deși mama îi spusese de o mie de ori să nu.';
/** Chapter 1 is large enough (~0.6 MB) to be split into parts. */
const SIZES = [20, 6000];
const PAGE_COUNT = 300;

const chunk = (count: number): ChapterChunk => ({
  sentences: Array.from({ length: count }, (_, i) => `${i + 1}. ${SENTENCE}`),
  sentencePages: Array.from({ length: count }, (_, i) =>
    toPageNumber(Math.min(PAGE_COUNT, Math.floor(i / 20) + 1)),
  ),
});

/** `<documents>/seed.pdf`: put a file there with `adb shell run-as` to seed a PDF as well. */
export const seedSourcePath = (booksDir: string): string =>
  `${booksDir.slice(0, booksDir.lastIndexOf('/'))}/seed.pdf`;

/**
 * Dev only: a book left `processing` (as if the import was killed), with a small chapter 0 and a
 * split chapter 1, written through the real repository. The PDF is copied when the seed file exists.
 */
export const seedSampleBook = async ({
  bookRepository,
  stores,
}: AppServices): Promise<BookMeta> => {
  const id = toBookId(uuidv4());
  const source = seedSourcePath(stores.files.booksDir());
  const stored = (await stores.files.exists(source))
    ? await bookRepository.storePdf(id, source)
    : null;
  const meta = bookMetaSchema.parse({
    id,
    title: `Carte de test ${id.slice(0, 4)}`,
    author: 'Dev',
    language: 'ro-RO',
    fileUri: stored?.path ?? stores.files.bookPdfPath(id),
    fileSizeBytes: stored?.sizeBytes ?? 0,
    pageCount: PAGE_COUNT,
    chapterCount: SIZES.length,
    sentenceCount: SIZES.reduce((sum, n) => sum + n, 0),
    status: 'processing',
    processedPages: 0,
    importedAt: new Date().toISOString(),
    coverColor: pickCoverColor(id),
  });
  await bookRepository.createBook(meta);
  for (const [index, size] of SIZES.entries()) {
    await bookRepository.saveChapter(id, toChapterIndex(index), chunk(size));
  }
  return meta;
};
