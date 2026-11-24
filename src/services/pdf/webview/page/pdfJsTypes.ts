// The parts of the pdf.js API (pdfjs-dist 6.5, legacy build) the WebView page uses. Declared here,
// type-only: the page is compiled file by file without bundling, and pdfjs-dist's own typings point
// at its ESM build.

export interface PdfJsTextItem {
  readonly str?: string;
  /** [a, b, c, d, e, f]: `f` is the baseline in PDF units from the bottom, `d` the font height. */
  readonly transform?: readonly number[];
  readonly height?: number;
  readonly hasEOL?: boolean;
}

export interface PdfJsPage {
  getViewport(options: { scale: number }): { height: number };
  getTextContent(): Promise<{ items: readonly PdfJsTextItem[] }>;
  cleanup(): void;
}

export interface PdfJsOutlineNode {
  readonly title: string;
  /** A named destination, an explicit one (`[pageRef, …]`), or none. */
  readonly dest: string | readonly unknown[] | null;
  readonly items: readonly PdfJsOutlineNode[];
}

export interface PdfJsDocument {
  readonly numPages: number;
  getPage(pageNumber: number): Promise<PdfJsPage>;
  getMetadata(): Promise<{ info: unknown }>;
  getOutline(): Promise<readonly PdfJsOutlineNode[] | null>;
  getDestination(name: string): Promise<readonly unknown[] | null>;
  getPageIndex(ref: unknown): Promise<number>;
  destroy(): Promise<void>;
}

export interface PdfJsLib {
  readonly version: string;
  getDocument(params: {
    data: Uint8Array;
    password?: string;
    isEvalSupported: boolean;
    disableFontFace: boolean;
  }): { promise: Promise<PdfJsDocument> };
}
