// Shared by RN and the WebView page (scripts/build-pdf-webview.js compiles this file into the
// page), so it must not import anything.

/** Most pages one `get-pages` request may ask for. */
export const MAX_PAGES_PER_REQUEST = 10;

/** Pages RN asks for per request (PROMPT §5: batches of 5). */
export const PAGES_PER_BATCH = 5;

/** Size of one PDF chunk sent to the WebView, before base64 (PROMPT §5: 512 KB). */
export const PDF_CHUNK_BYTES = 512 * 1024;
