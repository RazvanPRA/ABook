// Types for scripts/build-pdf-webview.js (a Node script), used by its tests.

/** Path of the generated module (gitignored). */
export const OUTPUT: string;
/** Page sources, in the order they are concatenated. */
export const PAGE_FILES: readonly string[];
/** The complete WebView page. */
export function buildHtml(): string;
/** SHA-256 of every input of the page; the generated module stores it. */
export function sourceHash(): string;
