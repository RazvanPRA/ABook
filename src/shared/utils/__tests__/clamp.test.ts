import { clamp } from '../clamp';

describe('clamp', () => {
  it.each([
    [0.5, 0, 1, 0.5],
    [-1, 0, 1, 0],
    [2, 0, 1, 1],
    [0, 0, 1, 0],
    [1, 0, 1, 1],
    [Infinity, 0, 100, 100],
    [-Infinity, 0, 100, 0],
    [NaN, 0, 1, 0],
  ])('clamp(%p, %p, %p) = %p', (value, min, max, expected) => {
    expect(clamp(value, min, max)).toBe(expected);
  });
});
