import ro from '@/shared/i18n/ro.json';
import { formatBytes } from '../formatBytes';
import { formatDecimal } from '../formatDecimal';
import { formatDuration } from '../formatDuration';
import { formatPercent } from '../formatPercent';

const KB = 1024;
const MB = KB * KB;
const GB = MB * KB;

describe('formatDecimal', () => {
  it.each([
    [1.25, 1, '1,3'],
    [2, 1, '2'],
    [8.94, 1, '8,9'],
    [0.5, 0, '1'],
    [10.0, 2, '10'],
    [3.1, 2, '3,1'],
  ])('formatDecimal(%p, %p) = %p', (value, decimals, expected) => {
    expect(formatDecimal(value, decimals)).toBe(expected);
  });
});

describe('formatBytes (units from ro.json)', () => {
  const units = ro.format.bytes;

  it.each([
    [0, '0 B'],
    [1, '1 B'],
    [1023, '1023 B'],
    [1024, '1 KB'],
    [512 * KB, '512 KB'],
    [1023.6 * KB, '1 MB'],
    [1.2 * MB, '1,2 MB'],
    [8.94 * MB, '8,9 MB'],
    [2 * MB, '2 MB'],
    [1.5 * GB, '1,5 GB'],
    [3000 * GB, '3000 GB'],
    [-5, '0 B'],
    [NaN, '0 B'],
    [Infinity, '0 B'],
  ])('formatBytes(%p) = %p', (bytes, expected) => {
    expect(formatBytes(bytes, units)).toBe(expected);
  });
});

describe('formatDuration (units from ro.json)', () => {
  const units = ro.format.duration;

  it.each([
    [0, '0 min'],
    [10, '< 1 min'],
    [29, '< 1 min'],
    [30, '1 min'],
    [12 * 60, '12 min'],
    [59 * 60 + 29, '59 min'],
    [59 * 60 + 30, '1 h'],
    [2 * 3600, '2 h'],
    [3600 + 52 * 60, '1 h 52 min'],
    [-60, '0 min'],
    [NaN, '0 min'],
  ])('formatDuration(%p) = %p', (seconds, expected) => {
    expect(formatDuration(seconds, units)).toBe(expected);
  });
});

describe('formatPercent', () => {
  it.each([
    [0, '0%'],
    [0.413, '41%'],
    [0.005, '1%'],
    [0.004, '0%'],
    [1, '100%'],
    [1.5, '100%'],
    [-0.2, '0%'],
    [NaN, '0%'],
  ])('formatPercent(%p) = %p', (ratio, expected) => {
    expect(formatPercent(ratio)).toBe(expected);
  });
});
