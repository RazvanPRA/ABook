/** WCAG 2.x contrast helpers. Pure functions; accept `#RGB` or `#RRGGBB`. */

const toChannels = (hex: string): [number, number, number] => {
  const raw = hex.replace('#', '');
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map(c => c + c)
          .join('')
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
};

const linearize = (c: number): number =>
  c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

export const relativeLuminance = (hex: string): number => {
  const [r, g, b] = toChannels(hex).map(linearize) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrastRatio = (a: string, b: string): number => {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  ) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};
