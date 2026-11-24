import { isRetryableFailure } from '../bookFailure';
import { BOOK_FAILURES } from '../schemas';

describe('isRetryableFailure', () => {
  it('retries a failure whose reason is unknown', () => {
    expect(isRetryableFailure({ status: 'failed', failure: null })).toBe(true);
  });

  it.each(BOOK_FAILURES)('does not retry %s', failure => {
    expect(isRetryableFailure({ status: 'failed', failure })).toBe(false);
  });

  it.each(['processing', 'ready'] as const)(
    'has nothing to retry on a %s book',
    status => {
      expect(isRetryableFailure({ status, failure: null })).toBe(false);
    },
  );
});
