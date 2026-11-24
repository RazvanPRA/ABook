import { PdfExtractionError } from '../PdfExtractionError';
import type { WebViewResponse, WebViewResponseType } from './messages';

/** How long a request may wait for its response by default. */
export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

export interface TrackOptions {
  readonly requestId: string;
  /** The response type that means success; any other non-error type is a protocol error. */
  readonly expected: WebViewResponseType;
  readonly timeoutMs?: number;
}

interface Pending {
  readonly expected: WebViewResponseType;
  readonly resolve: (response: WebViewResponse) => void;
  readonly reject: (error: PdfExtractionError) => void;
  readonly timer: ReturnType<typeof setTimeout>;
}

export interface RequestTracker {
  /** A new request id, unique for this tracker: `r1`, `r2`, … */
  nextId(): string;
  /** Waits for the response to a request; rejects with a `PdfExtractionError` on error or timeout. */
  track(options: TrackOptions): Promise<WebViewResponse>;
  /** Settles the request a response answers; `false` for events and late or unknown responses. */
  settle(response: WebViewResponse): boolean;
  /** Rejects every pending request (`cancelled` unless another code is given). */
  cancelAll(code?: 'cancelled' | 'boot', message?: string): void;
  /** Number of requests still waiting. */
  pendingCount(): number;
}

export function createRequestTracker(
  defaultTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): RequestTracker {
  const pending = new Map<string, Pending>();
  let counter = 0;

  const take = (requestId: string): Pending | undefined => {
    const entry = pending.get(requestId);
    if (entry) {
      clearTimeout(entry.timer);
      pending.delete(requestId);
    }
    return entry;
  };

  return {
    nextId: () => `r${(counter += 1)}`,
    track: ({ requestId, expected, timeoutMs = defaultTimeoutMs }) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          take(requestId);
          reject(new PdfExtractionError('timeout', `${requestId} timed out`));
        }, timeoutMs);
        pending.set(requestId, { expected, resolve, reject, timer });
      }),
    settle: response => {
      const entry =
        response.requestId === null ? undefined : take(response.requestId);
      if (entry) {
        settleEntry(entry, response);
      }
      return entry !== undefined;
    },
    cancelAll: (code = 'cancelled', message = 'request cancelled') => {
      for (const requestId of [...pending.keys()]) {
        take(requestId)?.reject(new PdfExtractionError(code, message));
      }
    },
    pendingCount: () => pending.size,
  };
}

function settleEntry(entry: Pending, response: WebViewResponse): void {
  if (response.type === 'error') {
    entry.reject(
      new PdfExtractionError(response.payload.code, response.payload.message),
    );
  } else if (response.type === entry.expected) {
    entry.resolve(response);
  } else {
    entry.reject(
      new PdfExtractionError(
        'protocol',
        `expected ${entry.expected}, got ${response.type}`,
      ),
    );
  }
}
