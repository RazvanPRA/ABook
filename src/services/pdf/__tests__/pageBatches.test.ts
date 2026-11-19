import { pageBatches } from '../extractor/pageBatches';

describe('pageBatches', () => {
  it('splits a range into batches, the last one shorter', () => {
    expect(pageBatches(1, 12, 5)).toEqual([
      { from: 1, to: 5 },
      { from: 6, to: 10 },
      { from: 11, to: 12 },
    ]);
  });

  it('keeps a range that fits in one batch', () => {
    expect(pageBatches(7, 9, 5)).toEqual([{ from: 7, to: 9 }]);
    expect(pageBatches(4, 4, 5)).toEqual([{ from: 4, to: 4 }]);
  });

  it('returns nothing for an empty range', () => {
    expect(pageBatches(5, 4, 5)).toEqual([]);
  });
});
