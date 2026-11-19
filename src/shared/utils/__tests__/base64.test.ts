/**
 * @jest-environment node
 */
/// <reference types="node" />
import { base64ToBytes, bytesToBase64 } from '../base64';

const bytes = (...values: number[]) => Uint8Array.from(values);

describe('bytesToBase64', () => {
  it.each([
    ['empty', bytes(), ''],
    ['one byte', bytes(77), 'TQ=='],
    ['two bytes', bytes(77, 97), 'TWE='],
    ['three bytes', bytes(77, 97, 110), 'TWFu'],
    [
      'the PDF header',
      Uint8Array.from(Buffer.from('%PDF-1.7')),
      'JVBERi0xLjc=',
    ],
    ['high bytes', bytes(255, 254, 253, 0), '//79AA=='],
  ])('%s', (_, input, expected) => {
    expect(bytesToBase64(input)).toBe(expected);
  });

  it('matches Node for every length up to 40 and for Romanian UTF-8', () => {
    for (let length = 0; length <= 40; length++) {
      const input = Uint8Array.from({ length }, (_, i) => (i * 37 + 11) % 256);
      expect(bytesToBase64(input)).toBe(Buffer.from(input).toString('base64'));
    }
    const text = Buffer.from('Știință, țară și „ghilimele”');
    expect(bytesToBase64(Uint8Array.from(text))).toBe(text.toString('base64'));
  });
});

describe('base64ToBytes', () => {
  it('round-trips every length up to 40, with and without padding', () => {
    for (let length = 0; length <= 40; length++) {
      const input = Uint8Array.from({ length }, (_, i) => (i * 53 + 3) % 256);
      const encoded = bytesToBase64(input);
      expect(base64ToBytes(encoded)).toEqual(input);
      expect(base64ToBytes(encoded.replace(/[=]+$/, ''))).toEqual(input);
    }
  });

  it('decodes what Node encodes', () => {
    const input = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj');
    expect(Buffer.from(base64ToBytes(input.toString('base64')))).toEqual(input);
  });

  it.each([
    ['a character outside the alphabet', 'TW-u'],
    ['whitespace', 'TW Fu'],
    ['URL-safe characters', 'TW_u'],
    ['an impossible length', 'TWFuT'],
  ])('rejects %s', (_, input) => {
    expect(() => base64ToBytes(input)).toThrow(/invalid base64/);
  });

  it('decodes the empty string', () => {
    expect(base64ToBytes('')).toEqual(new Uint8Array(0));
  });
});
