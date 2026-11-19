// Public API of services/pdf: the WebView bridge protocol and its errors.
// The WebView page itself (webview/page) and the generated HTML are internal.
export {
  MAX_PAGES_PER_REQUEST,
  PAGES_PER_BATCH,
  PDF_CHUNK_BYTES,
} from './limits';
export {
  PAGE_ERROR_CODES,
  PdfExtractionError,
  isPdfExtractionError,
} from './PdfExtractionError';
export type { PageErrorCode, PdfErrorCode } from './PdfExtractionError';
export {
  EXPECTED_RESPONSE,
  outlineItemSchema,
  pageTextSchema,
  webViewResponseSchema,
} from './protocol/messages';
export type {
  WebViewRequest,
  WebViewRequestType,
  WebViewResponse,
  WebViewResponseType,
} from './protocol/messages';
export { parseResponse } from './protocol/parseResponse';
export {
  DEFAULT_REQUEST_TIMEOUT_MS,
  createRequestTracker,
} from './protocol/requestTracker';
export type { RequestTracker, TrackOptions } from './protocol/requestTracker';
