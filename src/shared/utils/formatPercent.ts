import { clamp } from './clamp';

/** Ratio in [0, 1] as a whole percentage: 0.413 → "41%". Clamped; NaN → "0%". */
export const formatPercent = (ratio: number): string =>
  `${Math.round(clamp(ratio, 0, 1) * 100)}%`;
