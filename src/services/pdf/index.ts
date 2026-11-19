// Public API of services/pdf: the extractor, its WebView transport, the bridge protocol and errors.
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
export { createWebViewPdfExtractor } from './extractor/createWebViewPdfExtractor';
export type { WebViewPdfExtractorDeps } from './extractor/createWebViewPdfExtractor';
export {
  DEFAULT_BOOT_TIMEOUT_MS,
  type BridgeTimeouts,
} from './extractor/bridgeConnection';
export { createWebViewTransport } from './extractor/webViewTransport';
export type {
  PostToView,
  WebViewTransport,
} from './extractor/webViewTransport';
export type {
  BridgeListener,
  PdfBridgeTransport,
  PdfDocument,
  PdfTextExtractor,
  ReadChunk,
} from './extractor/types';
export { loadPdfWebViewHtml } from './webview/loadPdfWebViewHtml';
