import {
  bookMetaSchema,
  toBookId,
  toPageNumber,
  type BookId,
  type BookMeta,
  type ChapterChunk,
} from '@/shared/domain';
import { rawMeta } from '@/shared/domain/__fixtures__/rawValues';
import { InMemoryFileStore, InMemoryKeyValueStore } from '@/storage/testing';
import { createLocalBookRepository } from '../book';

export const BOOK_IDS: BookId[] = [
  '0b6f2f4e-7c1a-4d8e-9f3a-2a5b6c7d8e9f',
  '1c7a3e5f-8b2d-4c6e-9a1f-3b4c5d6e7f80',
  '2d8b4f60-9c3e-4d7f-8b20-4c5d6e7f8091',
].map(toBookId);

export const SOURCE_URI = '/cache/picked/carte.pdf';
export const SOURCE_SIZE = 2_345_678;

/** A valid meta, `processing` from page 0 unless overridden. */
export const makeMeta = (
  id: BookId,
  overrides: Partial<BookMeta> = {},
): BookMeta =>
  bookMetaSchema.parse(
    rawMeta({ id, status: 'processing', processedPages: 0, ...overrides }),
  );

const SENTENCE =
  'Nică a lui Ștefan a Petrei fugea desculț pe ulițele Humuleștilor, cu traista în băț.';

/** `count` unique sentences, 30 per page. 5000 sentences ≈ 0.5 MB, which needs splitting. */
export const makeChunk = (count: number): ChapterChunk => ({
  sentences: Array.from({ length: count }, (_, i) => `${i}: ${SENTENCE}`),
  sentencePages: Array.from({ length: count }, (_, i) =>
    toPageNumber(Math.floor(i / 30) + 1),
  ),
});

/** A repository over fresh fakes, with the picked PDF present at `SOURCE_URI`. */
export const setupRepository = () => {
  const kv = new InMemoryKeyValueStore();
  const files = new InMemoryFileStore();
  files.addFile(SOURCE_URI, SOURCE_SIZE);
  return { kv, files, repo: createLocalBookRepository({ kv, files }) };
};
