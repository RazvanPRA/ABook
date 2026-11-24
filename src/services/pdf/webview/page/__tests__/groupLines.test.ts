import { groupLines } from '../groupLines';
import type { PdfJsTextItem } from '../pdfJsTypes';

const PAGE_HEIGHT = 800;

/** A text item at `baseline` (PDF units from the bottom) with font size `size`. */
function item(
  str: string,
  baseline: number,
  size = 11,
  hasEOL = false,
): PdfJsTextItem {
  return { str, transform: [size, 0, 0, size, 72, baseline], hasEOL };
}

describe('groupLines', () => {
  it('joins items on the same baseline into one line', () => {
    expect(
      groupLines(
        [item('Ion ', 700), item('iubea ', 700), item('pământul.', 700)],
        PAGE_HEIGHT,
      ),
    ).toEqual([{ text: 'Ion iubea pământul.', y: 0.125, height: 11 }]);
  });

  it('starts a new line on another baseline, and measures y from the top', () => {
    expect(
      groupLines(
        [
          item('Antet', 768, 9),
          item('Capitolul I', 720, 18),
          item('Text.', 690),
        ],
        PAGE_HEIGHT,
      ),
    ).toEqual([
      { text: 'Antet', y: 0.04, height: 9 },
      { text: 'Capitolul I', y: 0.1, height: 18 },
      { text: 'Text.', y: 0.138, height: 11 },
    ]);
  });

  it('keeps a slightly raised item (a superscript) on its line', () => {
    // raised by 3 units, less than half its 7-unit font
    expect(
      groupLines([item('Nota', 700), item('1', 703, 7)], PAGE_HEIGHT),
    ).toEqual([{ text: 'Nota1', y: 0.125, height: 11 }]);
  });

  it('starts a new line after hasEOL, even on the same baseline', () => {
    expect(
      groupLines(
        [item('Prima', 700, 11, true), item('A doua', 700)],
        PAGE_HEIGHT,
      ).map(l => l.text),
    ).toEqual(['Prima', 'A doua']);
  });

  it('drops blank lines and items that are not text', () => {
    const items: PdfJsTextItem[] = [
      item('', 760, 11, true),
      item('   ', 740),
      { transform: [11, 0, 0, 11, 0, 720] },
      { str: 'fără poziție' },
      item('Text', 700),
    ];
    expect(groupLines(items, PAGE_HEIGHT).map(l => l.text)).toEqual(['Text']);
  });

  it('falls back to the item height when the transform has no scale', () => {
    const items: PdfJsTextItem[] = [
      { str: 'Rotit', transform: [0, 12, -12, 0, 72, 400], height: 12 },
      { str: 'Fără înălțime', transform: [0, 0, 0, 0, 72, 300] },
    ];
    expect(groupLines(items, PAGE_HEIGHT).map(l => l.height)).toEqual([12, 0]);
  });

  it('clamps y to 0–1 and survives a zero page height', () => {
    expect(
      groupLines([item('Sus', 900), item('Jos', -50)], PAGE_HEIGHT).map(
        l => l.y,
      ),
    ).toEqual([0, 1]);
    expect(groupLines([item('X', 10)], 0).map(l => l.y)).toEqual([0]);
  });

  it('returns nothing for a page without text', () => {
    expect(groupLines([], PAGE_HEIGHT)).toEqual([]);
  });
});
