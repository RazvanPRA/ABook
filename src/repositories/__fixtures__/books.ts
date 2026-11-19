import { toPageNumber, type ChapterChunk } from '@/shared/domain';
import { InMemoryFileStore, InMemoryKeyValueStore } from '@/storage/testing';
import { createLocalBookRepository } from '../book';

// Domain samples live in shared, so features' tests can use them too
export { BOOK_IDS, makeMeta } from '@/shared/domain/__fixtures__/books';

export const SOURCE_URI = '/cache/picked/carte.pdf';
export const SOURCE_SIZE = 2_345_678;

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
