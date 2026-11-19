/** Limits `value` to [min, max]. NaN becomes `min`, so a bad input never leaks into layout. */
export const clamp = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
};
