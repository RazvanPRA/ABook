import { makeText, makeToc, position as at } from '../../__fixtures__/chapters';
import {
  chapterOfPage,
  clampPosition,
  firstPosition,
  nextChapter,
  nextPosition,
  pageOf,
  previousPosition,
  sentenceOfPage,
} from '../position';

// 0 is empty, 1 has three sentences, 2 and 3 are empty, 4 has two, 5 is empty
const TOC = makeToc([[], [1, 1, 2], [], [], [5, 6], []]);

describe('moving by sentence', () => {
  it.each([
    [at(1, 0), at(1, 1)],
    [at(1, 2), at(4, 0)],
    [at(4, 0), at(4, 1)],
    [at(4, 1), null],
    [at(0, 0), at(1, 0)],
    [at(9, 0), null],
  ])('after %j comes %j', (from, expected) => {
    expect(nextPosition(TOC, from)).toEqual(expected);
  });

  it.each([
    [at(1, 1), at(1, 0)],
    [at(1, 0), null],
    [at(4, 0), at(1, 2)],
    [at(5, 0), at(4, 1)],
  ])('before %j comes %j', (from, expected) => {
    expect(previousPosition(TOC, from)).toEqual(expected);
  });

  it('starts at the first chapter with text', () => {
    expect(firstPosition(TOC)).toEqual(at(1, 0));
    expect(firstPosition([])).toBeNull();
    expect(firstPosition(makeToc([[], []]))).toBeNull();
    expect(nextChapter(TOC, 4)).toBeNull();
  });
});

describe('clampPosition', () => {
  it.each([
    [at(1, 1), at(1, 1)],
    [at(1, 99), at(1, 2)],
    [at(2, 7), at(4, 0)],
    [at(5, 0), at(4, 1)],
    [at(99, 3), at(4, 1)],
  ])('%j becomes %j', (from, expected) => {
    expect(clampPosition(TOC, from)).toEqual(expected);
  });

  it('has nowhere to go in a book without text', () => {
    expect(clampPosition([], at(0, 0))).toBeNull();
    expect(clampPosition(makeToc([[]]), at(0, 0))).toBeNull();
  });
});

describe('pages', () => {
  it.each([
    [1, 1],
    [2, 1],
    [3, 4],
    [6, 4],
    [50, 4],
  ])('page %d is reached by chapter %d', (page, chapter) => {
    expect(chapterOfPage(TOC, page)?.index).toBe(chapter);
  });

  it('is in no chapter of an empty book', () => {
    expect(chapterOfPage([], 1)).toBeNull();
  });

  it.each([
    [1, 0],
    [2, 2],
    [3, 3],
    [4, 3],
    [9, 4],
  ])('page %d starts at sentence %d', (page, sentence) => {
    expect(sentenceOfPage(makeText(0, [1, 1, 2, 4, 5]), page)).toBe(sentence);
  });

  it('tells the page of a position, loaded or not', () => {
    expect(pageOf(TOC, at(4, 1), makeText(4, [5, 6]))).toBe(6);
    expect(pageOf(TOC, at(4, 1), null)).toBe(5);
    expect(pageOf(TOC, at(40, 1), null)).toBeNull();
    expect(sentenceOfPage(makeText(0, []), 3)).toBe(0);
  });
});
