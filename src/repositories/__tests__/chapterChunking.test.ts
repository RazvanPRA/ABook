import { toPageNumber, type ChapterChunk } from '@/shared/domain';
import { utf8ByteLength } from '@/shared/utils';
import { joinChapterParts, splitChapterChunk } from '../chapterChunking';
import { MAX_VALUE_BYTES } from '../limits';

const SAMPLE =
  'Stau câteodată și-mi aduc aminte ce vremi și ce oameni mai erau în părțile noastre pe când începusem și eu, drăgăliță-Doamne, a mă ridica băiețaș la casa părinților mei, în satul Humulești.';

/** `count` sentences, ~40 per page, each made unique so misplaced ones would be caught. */
const chapter = (count: number, text = SAMPLE): ChapterChunk => ({
  sentences: Array.from({ length: count }, (_, i) => `${i}. ${text}`),
  sentencePages: Array.from({ length: count }, (_, i) =>
    toPageNumber(Math.floor(i / 40) + 1),
  ),
});

const bytesOf = (chunk: ChapterChunk) => utf8ByteLength(JSON.stringify(chunk));

describe('splitChapterChunk', () => {
  it('keeps a chapter that fits as a single, identical part', () => {
    const small = chapter(10);
    expect(splitChapterChunk(small)).toEqual([small]);
  });

  it('keeps an empty chapter as a single part', () => {
    const empty: ChapterChunk = { sentences: [], sentencePages: [] };
    expect(splitChapterChunk(empty)).toEqual([empty]);
  });

  it('splits ~1 MB of Romanian text into parts under the limit that join back', () => {
    const big = chapter(5000);
    expect(bytesOf(big)).toBeGreaterThan(4 * MAX_VALUE_BYTES);

    const parts = splitChapterChunk(big);
    expect(parts.length).toBeGreaterThanOrEqual(5);
    parts.forEach(part => {
      expect(bytesOf(part)).toBeLessThanOrEqual(MAX_VALUE_BYTES);
      expect(part.sentences.length).toBeGreaterThan(0);
      expect(part.sentencePages).toHaveLength(part.sentences.length);
    });
    expect(joinChapterParts(parts)).toEqual(big);
  });

  it('respects a custom limit exactly, with whole sentences only', () => {
    const source = chapter(50);
    const limit = 2000;
    const parts = splitChapterChunk(source, limit);
    expect(parts.every(part => bytesOf(part) <= limit)).toBe(true);
    expect(parts.flatMap(part => part.sentences)).toEqual(source.sentences);
  });

  it('measures bytes, not characters (diacritics are 2 bytes)', () => {
    const ascii = chapter(20, 'a'.repeat(100));
    const romanian = chapter(20, 'ă'.repeat(100));
    const limit = bytesOf(ascii) + 10;
    expect(splitChapterChunk(ascii, limit)).toHaveLength(1);
    expect(splitChapterChunk(romanian, limit).length).toBeGreaterThan(1);
  });

  it('rejects a sentence that cannot fit in any part', () => {
    const huge: ChapterChunk = {
      sentences: ['scurt.', 'x'.repeat(5000)],
      sentencePages: [toPageNumber(1), toPageNumber(1)],
    };
    expect(() => splitChapterChunk(huge, 1000)).toThrow(/Sentence 1/);
  });

  it('rejects a misaligned chunk', () => {
    const misaligned: ChapterChunk = {
      sentences: ['a'.repeat(600), 'b'.repeat(600)],
      sentencePages: [toPageNumber(1)],
    };
    expect(() => splitChapterChunk(misaligned, 1000)).toThrow(/misaligned/);
  });
});

describe('joinChapterParts', () => {
  it('concatenates in order and handles no parts', () => {
    const [a, b] = [chapter(2), chapter(3)];
    expect(joinChapterParts([a, b]).sentences).toEqual([
      ...a.sentences,
      ...b.sentences,
    ]);
    expect(joinChapterParts([])).toEqual({ sentences: [], sentencePages: [] });
  });
});
