import type { OutlineItem, PageText } from '@/services/text';

/** What `open` learns about a PDF. */
export interface PdfDocument {
  readonly pageCount: number;
  readonly info: {
    readonly title: string | null;
    readonly author: string | null;
  };
}

/**
 * Extracts text from one PDF at a time. Every method rejects with a `PdfExtractionError`
 * (`password`, `corrupt`, `timeout`, `cancelled`, …); `close` never rejects.
 */
export interface PdfTextExtractor {
  /** Opens the PDF at `path` (an app file), closing any document opened before. */
  open(path: string): Promise<PdfDocument>;
  /** The lines of pages `from`–`to` (1-based, inclusive), asked for in batches of 5. */
  getPages(from: number, to: number): Promise<PageText[]>;
  /** The document outline (bookmarks), `[]` when it has none. */
  getOutline(): Promise<OutlineItem[]>;
  /** Rejects pending calls with `cancelled`, closes the document and releases the WebView. */
  close(): Promise<void>;
}

/** Base64 of the bytes `[offset, offset + length)` of a file, `''` past its end (`FileStore.readBase64`). */
export type ReadChunk = (
  path: string,
  offset: number,
  length: number,
) => Promise<string>;

/** What the transport tells the extractor. */
export interface BridgeListener {
  /** A raw message posted by the page. */
  message(raw: string): void;
  /** The WebView failed (load error, render process gone, not attached). */
  failure(reason: string): void;
}

/** The extractor's view of the hidden WebView, implemented by `createWebViewTransport`. */
export interface PdfBridgeTransport {
  /** Asks for a fresh WebView; the page announces itself with a `ready` event. */
  mount(): void;
  /** Releases the WebView. */
  unmount(): void;
  /** Posts a message to the page. */
  post(message: string): void;
  /** Subscribes to the page's messages and failures; returns the unsubscribe function. */
  listen(listener: BridgeListener): () => void;
}
