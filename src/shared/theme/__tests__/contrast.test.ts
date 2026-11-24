import { color } from '../colors';
import { opacity } from '../motion';
import { contrastRatio, relativeLuminance } from '../contrast';

const AA = 4.5;

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('accepts the short #RGB form', () => {
    expect(relativeLuminance('#FFF')).toBeCloseTo(1, 5);
  });

  it('rejects invalid colors', () => {
    expect(() => relativeLuminance('#12')).toThrow('Invalid hex color');
    expect(() => relativeLuminance('#GGGGGG')).toThrow('Invalid hex color');
  });
});

describe('contrastRatio', () => {
  it('is 21 for black on white, regardless of order', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 5);
  });

  it('is 1 for identical colors', () => {
    expect(contrastRatio(color.bg, color.bg)).toBe(1);
  });
});

it('highlight is the accent at its opacity over the surface', () => {
  const channels = (hex: string) =>
    [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const under = channels(color.surface);
  const blended = channels(color.accent).map((own, i) =>
    Math.floor(
      own * opacity.highlight + (under[i] ?? 0) * (1 - opacity.highlight),
    ),
  );
  expect(channels(color.highlight)).toEqual(blended);
});

describe('palette contrast (PROMPT §8: text ≥ 4.5:1)', () => {
  const foregrounds = [
    'text',
    'textMuted',
    'textRead',
    'textUpcoming',
    'danger',
    'success',
    'accent',
    'info',
  ] as const;
  const backgrounds = ['bg', 'surface', 'tabBar'] as const;

  const pairs = foregrounds.flatMap(fg => backgrounds.map(bg => [fg, bg]));

  it.each(pairs)('%s on %s', (fg, bg) => {
    expect(contrastRatio(color[fg], color[bg])).toBeGreaterThanOrEqual(AA);
  });

  it.each([
    ['onAccent', 'accent'],
    ['text', 'highlight'],
    ['text', 'surfaceRaised'],
    ['textMuted', 'surfaceRaised'],
    ['success', 'successBg'],
    ['text', 'cover0'],
    ['text', 'cover1'],
    ['text', 'cover2'],
  ])('%s on %s', (fg, bg) => {
    const lookup = (name: string): string =>
      name.startsWith('cover')
        ? (color.cover[Number(name.slice(5))] ?? '')
        : color[name as keyof Omit<typeof color, 'cover'>];
    expect(contrastRatio(lookup(fg), lookup(bg))).toBeGreaterThanOrEqual(AA);
  });
});
