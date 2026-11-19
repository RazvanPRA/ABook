/**
 * Romanian decimal notation without relying on Hermes' Intl: comma separator, trailing ",0" dropped.
 * formatDecimal(1.25, 1) → "1,3"; formatDecimal(2, 1) → "2".
 */
export const formatDecimal = (value: number, decimals: number): string => {
  const fixed = value.toFixed(decimals);
  const trimmed = decimals > 0 ? fixed.replace(/\.?0+$/, '') : fixed;
  return trimmed.replace('.', ',');
};
