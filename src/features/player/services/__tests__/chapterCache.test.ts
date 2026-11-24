import { toChapterIndex as ch, type ChapterChunk } from '@/shared/domain';
import { makeText } from '../../__fixtures__/chapters';
import { createChapterCache } from '../chapterCache';

const setup = () => {
  const read = jest.fn(async (chapter: number): Promise<ChapterChunk | null> =>
    makeText(chapter, [1]),
  );
  return { read, cache: createChapterCache(read) };
};

it('keeps the last three used', async () => {
  const { read, cache } = setup();
  for (const chapter of [0, 1, 2]) {
    await cache.get(ch(chapter));
  }
  await cache.get(ch(0));
  await cache.get(ch(3));
  expect(read).toHaveBeenCalledTimes(4);
  expect([0, 1, 2, 3].map(chapter => cache.peek(ch(chapter)) !== null)).toEqual(
    [true, false, true, true],
  );
});

it('reads a chapter once, however many ask', async () => {
  const { read, cache } = setup();
  cache.prefetch(ch(1));
  const [a, b] = await Promise.all([cache.get(ch(1)), cache.get(ch(1))]);
  expect(read).toHaveBeenCalledTimes(1);
  expect(a).toBe(b);
});

it('reads a missing or failed chapter again', async () => {
  const { read, cache } = setup();
  read.mockResolvedValueOnce(null);
  expect(await cache.get(ch(1))).toBeNull();
  read.mockRejectedValueOnce(new Error('disk'));
  await expect(cache.get(ch(1))).rejects.toThrow('disk');
  expect(await cache.get(ch(1))).not.toBeNull();
});

it('keeps quiet about a failed prefetch', async () => {
  const { read, cache } = setup();
  read.mockRejectedValueOnce(new Error('disk'));
  cache.prefetch(ch(1));
  await Promise.resolve();
  expect(cache.peek(ch(1))).toBeNull();
});

it('forgets everything on clear, late reads too', async () => {
  const { cache } = setup();
  await cache.get(ch(0));
  const late = cache.get(ch(1));
  cache.clear();
  await late;
  expect(cache.peek(ch(0))).toBeNull();
  expect(cache.peek(ch(1))).toBeNull();
});
