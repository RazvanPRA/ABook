/**
 * The generated WebView page (2.4 MB), loaded only when the WebView is first mounted, so app
 * start doesn't pay for it (PROMPT §8: first screen < 1.5 s).
 */
export const loadPdfWebViewHtml = async (): Promise<string> =>
  (await import('./generated/pdfWebViewHtml')).PDF_WEBVIEW_HTML;
