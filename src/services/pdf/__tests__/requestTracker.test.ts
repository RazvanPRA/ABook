import { PdfExtractionError } from '../PdfExtractionError';
import type { WebViewResponse } from '../protocol/messages';
import { createRequestTracker } from '../protocol/requestTracker';

const closed = (requestId: string): WebViewResponse => ({
  type: 'closed',
  requestId,
  payload: {},
});

async function rejection(
  promise: Promise<unknown>,
): Promise<PdfExtractionError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof PdfExtractionError) {
      return error;
    }
    throw error;
  }
  throw new Error('expected a rejection');
}

describe('createRequestTracker', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('gives unique ids', () => {
    const tracker = createRequestTracker();
    expect([tracker.nextId(), tracker.nextId(), tracker.nextId()]).toEqual([
      'r1',
      'r2',
      'r3',
    ]);
  });

  it('resolves a request with its expected response', async () => {
    const tracker = createRequestTracker();
    const pending = tracker.track({ requestId: 'r1', expected: 'closed' });
    expect(tracker.pendingCount()).toBe(1);
    expect(tracker.settle(closed('r1'))).toBe(true);
    await expect(pending).resolves.toEqual(closed('r1'));
    expect(tracker.pendingCount()).toBe(0);
  });

  it('rejects with the page error code', async () => {
    const tracker = createRequestTracker();
    const pending = tracker.track({ requestId: 'r1', expected: 'opened' });
    tracker.settle({
      type: 'error',
      requestId: 'r1',
      payload: { code: 'password', message: 'No password given' },
    });
    const error = await rejection(pending);
    expect(error.code).toBe('password');
    expect(error.message).toBe('No password given');
  });

  it('rejects an unexpected response type as a protocol error', async () => {
    const tracker = createRequestTracker();
    const pending = tracker.track({ requestId: 'r1', expected: 'opened' });
    tracker.settle(closed('r1'));
    expect((await rejection(pending)).code).toBe('protocol');
  });

  it('times out with the default and with a per-request timeout', async () => {
    const tracker = createRequestTracker(1000);
    const slow = tracker.track({ requestId: 'r1', expected: 'closed' });
    const quick = tracker.track({
      requestId: 'r2',
      expected: 'closed',
      timeoutMs: 100,
    });
    jest.advanceTimersByTime(100);
    expect((await rejection(quick)).code).toBe('timeout');
    expect(tracker.pendingCount()).toBe(1);
    jest.advanceTimersByTime(900);
    expect((await rejection(slow)).code).toBe('timeout');
    expect(tracker.pendingCount()).toBe(0);
  });

  it('drops late, unknown and event messages', async () => {
    const tracker = createRequestTracker(100);
    const pending = tracker.track({ requestId: 'r1', expected: 'closed' });
    jest.advanceTimersByTime(100);
    await rejection(pending);
    expect(tracker.settle(closed('r1'))).toBe(false);
    expect(tracker.settle(closed('r9'))).toBe(false);
    expect(
      tracker.settle({
        type: 'ready',
        requestId: null,
        payload: { version: '6.5.438' },
      }),
    ).toBe(false);
  });

  it('settles a request only once', async () => {
    const tracker = createRequestTracker();
    const pending = tracker.track({ requestId: 'r1', expected: 'closed' });
    expect(tracker.settle(closed('r1'))).toBe(true);
    expect(tracker.settle(closed('r1'))).toBe(false);
    await expect(pending).resolves.toEqual(closed('r1'));
  });

  it('cancels every pending request, and clears their timers', async () => {
    const tracker = createRequestTracker();
    const first = tracker.track({ requestId: 'r1', expected: 'pages' });
    const second = tracker.track({ requestId: 'r2', expected: 'pages' });
    tracker.cancelAll();
    expect((await rejection(first)).code).toBe('cancelled');
    expect((await rejection(second)).code).toBe('cancelled');
    expect(tracker.pendingCount()).toBe(0);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('cancels with another code, for a WebView that failed to boot', async () => {
    const tracker = createRequestTracker();
    const pending = tracker.track({ requestId: 'r1', expected: 'opened' });
    tracker.cancelAll('boot', 'pdf.js did not load');
    const error = await rejection(pending);
    expect(error.code).toBe('boot');
    expect(error.message).toBe('pdf.js did not load');
  });
});
