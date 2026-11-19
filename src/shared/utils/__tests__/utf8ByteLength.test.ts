/**
 * @jest-environment node
 */
/// <reference types="node" />
import { utf8ByteLength } from '../utf8ByteLength';

describe('utf8ByteLength', () => {
  it.each([
    ['', 0],
    ['abc', 3],
    ['ăîșțâ', 10],
    ['ĂÎȘȚÂ', 10],
    ['€', 3],
    ['📖', 4],
    ['a📖b', 6],
  ])('utf8ByteLength(%p) = %p', (value, expected) => {
    expect(utf8ByteLength(value)).toBe(expected);
  });

  it('counts a lone surrogate like its U+FFFD replacement', () => {
    expect(utf8ByteLength('\ud83d')).toBe(3);
    expect(utf8ByteLength('\udcd6x')).toBe(4);
  });

  it('matches Node for mixed Romanian text and JSON', () => {
    const text = JSON.stringify({
      sentences: ['Și-a făcut țâțâna „aici”.', 'Ştiinţă cu sedilă — 📚.'],
      sentencePages: [1, 2],
    });
    expect(utf8ByteLength(text)).toBe(Buffer.byteLength(text, 'utf8'));
  });
});
