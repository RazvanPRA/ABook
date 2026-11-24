import { logger } from '@/shared/utils';
import { PdfExtractionError } from '../PdfExtractionError';
import {
  EXPECTED_RESPONSE,
  type ResponseFor,
  type WebViewRequest,
  type WebViewRequestBody,
  type WebViewResponse,
} from '../protocol/messages';
import { parseResponse } from '../protocol/parseResponse';
import { createRequestTracker } from '../protocol/requestTracker';
import type { PdfBridgeTransport } from './types';

/** How long the page may take to boot (decode + import pdf.js); the spike's first start took ~2 s. */
export const DEFAULT_BOOT_TIMEOUT_MS = 20_000;

export interface BridgeTimeouts {
  readonly bootMs?: number;
  readonly requestMs?: number;
}

/** Requests over the transport, numbered and matched with their responses. */
export interface BridgeConnection {
  /** Mounts the WebView if needed and waits for its `ready` event. */
  start(): Promise<void>;
  /** Sends a request; resolves with its success response, rejects with a `PdfExtractionError`. */
  request<B extends WebViewRequestBody>(
    body: B,
  ): Promise<ResponseFor<B['type']>>;
  /** Rejects pending requests with `cancelled` and releases the WebView. */
  stop(): void;
}

interface Boot {
  readonly promise: Promise<void>;
  readonly resolve: () => void;
  readonly reject: (error: PdfExtractionError) => void;
}

export function createBridgeConnection(
  transport: PdfBridgeTransport,
  timeouts: BridgeTimeouts = {},
): BridgeConnection {
  const tracker = createRequestTracker(timeouts.requestMs);
  let boot: Boot | null = null;

  const reset = (error: PdfExtractionError) => {
    boot?.reject(error);
    boot = null;
    tracker.cancelAll(
      error.code === 'boot' ? 'boot' : 'cancelled',
      error.message,
    );
    transport.unmount();
  };
  const route = (response: WebViewResponse | null) => {
    if (response?.type === 'ready') {
      boot?.resolve();
    } else if (response?.type === 'error' && response.requestId === null) {
      reset(new PdfExtractionError('boot', response.payload.message));
    } else if (response && !tracker.settle(response)) {
      logger.warn('pdf bridge: unexpected message', response.type);
    }
  };

  transport.listen({
    message: raw => route(parseResponse(raw)),
    failure: reason => reset(new PdfExtractionError('boot', reason)),
  });

  return {
    start: () => {
      boot ??= startBoot(transport, reset, timeouts.bootMs);
      return boot.promise;
    },
    request: body => send(transport, tracker, body),
    stop: () => reset(new PdfExtractionError('cancelled', 'bridge stopped')),
  };
}

function startBoot(
  transport: PdfBridgeTransport,
  onTimeout: (error: PdfExtractionError) => void,
  timeoutMs = DEFAULT_BOOT_TIMEOUT_MS,
): Boot {
  let settle: Pick<Boot, 'resolve' | 'reject'> | undefined;
  const promise = new Promise<void>((resolve, reject) => {
    settle = { resolve, reject };
  });
  // Rejections reach the caller of start(); a boot nobody awaits must not be an unhandled one
  promise.catch(() => undefined);
  const timer = setTimeout(
    () => onTimeout(new PdfExtractionError('boot', 'WebView did not start')),
    timeoutMs,
  );
  const boot: Boot = {
    promise,
    resolve: () => {
      clearTimeout(timer);
      settle?.resolve();
    },
    reject: error => {
      clearTimeout(timer);
      settle?.reject(error);
    },
  };
  transport.mount();
  return boot;
}

async function send<B extends WebViewRequestBody>(
  transport: PdfBridgeTransport,
  tracker: ReturnType<typeof createRequestTracker>,
  body: B,
): Promise<ResponseFor<B['type']>> {
  const requestId = tracker.nextId();
  const expected: WebViewResponse['type'] = EXPECTED_RESPONSE[body.type];
  const request: WebViewRequest = { ...body, requestId };
  const pending = tracker.track({ requestId, expected });
  transport.post(JSON.stringify(request));
  const response = await pending;
  if (!isResponseFor<B['type']>(response, body.type)) {
    throw new PdfExtractionError('protocol', `unexpected ${response.type}`);
  }
  return response;
}

function isResponseFor<T extends WebViewRequestBody['type']>(
  response: WebViewResponse,
  type: T,
): response is ResponseFor<T> {
  return response.type === EXPECTED_RESPONSE[type];
}
