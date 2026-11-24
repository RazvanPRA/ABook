import { line } from '../__fixtures__/pages';
import {
  PAGE_BAND,
  headerSignature,
  isInBottomBand,
  isInPageBand,
  isInTopBand,
} from '../pageBands';

describe('page bands', () => {
  it.each([
    [0, true, false],
    [PAGE_BAND - 0.01, true, false],
    [PAGE_BAND, false, false],
    [0.5, false, false],
    [1 - PAGE_BAND, false, false],
    [1 - PAGE_BAND + 0.01, false, true],
    [1, false, true],
  ])('y = %p → top %p, bottom %p', (y, top, bottom) => {
    const sample = line('x', y);
    expect(isInTopBand(sample)).toBe(top);
    expect(isInBottomBand(sample)).toBe(bottom);
    expect(isInPageBand(sample)).toBe(top || bottom);
  });
});

describe('headerSignature', () => {
  it.each([
    ['ION — Liviu Rebreanu', 'ion — liviu rebreanu'],
    ['  Ion   —  Liviu\tRebreanu ', 'ion — liviu rebreanu'],
    ['Pagina 12 din 300', 'pagina # din #'],
    ['Capitolul 3 · 47', 'capitolul # · #'],
    ['ȘTIINȚĂ ȘI ÎNȚELEPCIUNE', 'știință și înțelepciune'],
    ['', ''],
    ['   ', ''],
  ])('%p → %p', (text, expected) => {
    expect(headerSignature(text)).toBe(expected);
  });

  it('gives the same key to headers that differ only by their numbers', () => {
    expect(headerSignature('Partea întâi — 9')).toBe(
      headerSignature('PARTEA ÎNTÂI — 108'),
    );
  });
});
