import type { WebViewRequest } from '../../protocol/messages';

// Runs inside the WebView (compiled by scripts/build-pdf-webview.js); no runtime imports, so the
// requests from RN are checked by hand here (zod validates the responses on the RN side).

type Payload = Record<string, unknown>;

const isObject = (value: unknown): value is Payload =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

const PAYLOAD_CHECKS: Readonly<Record<string, (payload: Payload) => boolean>> =
  {
    'load-chunk': p => isCount(p.index) && typeof p.data === 'string',
    open: p =>
      isCount(p.chunkCount) &&
      (p.password === null || typeof p.password === 'string'),
    'get-pages': p => isCount(p.from) && isCount(p.to),
    'get-outline': () => true,
    close: () => true,
  };

/** The request, if `value` is a well-formed one; `null` otherwise. */
export function parseRequest(value: unknown): WebViewRequest | null {
  if (
    !isObject(value) ||
    typeof value.type !== 'string' ||
    typeof value.requestId !== 'string' ||
    !isObject(value.payload)
  ) {
    return null;
  }
  const check = PAYLOAD_CHECKS[value.type];
  // The checks above prove the shape of the request type they are keyed by.
  return check && check(value.payload)
    ? (value as unknown as WebViewRequest)
    : null;
}
