import { clamp } from '@/shared/utils';
import type { SliderRange } from './Slider.types';

/** A screen reader's step on a continuous slider. */
const DEFAULT_STEPS = 10;

/** Steps like 0.1 don't add up exactly. */
const DECIMALS = 6;

const round = (value: number) => Number(value.toFixed(DECIMALS));

/** The closest value the slider can have. */
export function snap(value: number, { min, max, step }: SliderRange): number {
  const snapped = step ? min + Math.round((value - min) / step) * step : value;
  return round(clamp(snapped, min, max));
}

/** Where a value is on the track, 0 to 1. */
export function fractionOf(value: number, { min, max }: SliderRange): number {
  return max > min ? clamp((value - min) / (max - min), 0, 1) : 0;
}

/** The value at a place on the track, 0 to 1. */
export const valueAt = (fraction: number, range: SliderRange): number =>
  snap(range.min + clamp(fraction, 0, 1) * (range.max - range.min), range);

/** One step up (1) or down (-1). */
export function stepFrom(
  value: number,
  direction: number,
  range: SliderRange,
): number {
  const step = range.step ?? (range.max - range.min) / DEFAULT_STEPS;
  return snap(value + direction * step, range);
}
