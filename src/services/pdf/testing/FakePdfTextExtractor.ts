import type { OutlineItem, PageText } from '@/services/text';
import { PdfExtractionError, type PdfErrorCode } from '../PdfExtractionError';
import type { PdfDocument, PdfTextExtractor } from '../extractor/types';

/** A PDF the fake knows, by path. */
export interface FakePdf {
  readonly pages: readonly PageText[];
  readonly title?: string | null;
  readonly author?: string | null;
  readonly outline?: readonly OutlineItem[];
  /** `open` rejects with this code (`password`, `corrupt`, …). */
  readonly openError?: PdfErrorCode;
  /** `getPages` rejects with `timeout` once it reaches this page. */
  readonly failAtPage?: number;
}

type Call = 'open' | 'getPages' | 'getOutline' | 'close';

/**
 * In-memory `PdfTextExtractor` for feature tests: PDFs are registered with `addPdf`, every call is
 * logged in `calls`, and `close` rejects a `getPages` that is waiting at `pauseAt` (cancel tests).
 */
export class FakePdfTextExtractor implements PdfTextExtractor {
  readonly calls: { call: Call; args: readonly unknown[] }[] = [];
  private readonly pdfs = new Map<string, FakePdf>();
  private current: FakePdf | null = null;
  private waiting: {
    resolve: () => void;
    reject: (error: PdfExtractionError) => void;
  } | null = null;
  private pauseAt: number | null = null;

  addPdf(path: string, pdf: FakePdf): this {
    this.pdfs.set(path, pdf);
    return this;
  }

  /** The next `getPages` whose range includes `page` waits until `resume` or `close`. */
  pauseAtPage(page: number): void {
    this.pauseAt = page;
  }

  /** Lets a paused `getPages` finish. */
  resume(): void {
    this.pauseAt = null;
    const waiting = this.waiting;
    this.waiting = null;
    waiting?.resolve();
  }

  isOpen(): boolean {
    return this.current !== null;
  }

  async open(path: string): Promise<PdfDocument> {
    this.calls.push({ call: 'open', args: [path] });
    const pdf = this.pdfs.get(path);
    if (!pdf) {
      throw new PdfExtractionError('corrupt', `no fake PDF at ${path}`);
    }
    if (pdf.openError) {
      throw new PdfExtractionError(pdf.openError, `fake ${pdf.openError}`);
    }
    this.current = pdf;
    return {
      pageCount: pdf.pages.length,
      info: { title: pdf.title ?? null, author: pdf.author ?? null },
    };
  }

  async getPages(from: number, to: number): Promise<PageText[]> {
    this.calls.push({ call: 'getPages', args: [from, to] });
    const pdf = this.document();
    if (this.pauseAt !== null && from <= this.pauseAt && this.pauseAt <= to) {
      await this.pause();
    }
    if (pdf.failAtPage !== undefined && pdf.failAtPage <= to) {
      throw new PdfExtractionError('timeout', 'fake timeout');
    }
    return pdf.pages.filter(page => page.page >= from && page.page <= to);
  }

  async getOutline(): Promise<OutlineItem[]> {
    this.calls.push({ call: 'getOutline', args: [] });
    return [...(this.document().outline ?? [])];
  }

  async close(): Promise<void> {
    this.calls.push({ call: 'close', args: [] });
    this.current = null;
    const waiting = this.waiting;
    this.waiting = null;
    waiting?.reject(new PdfExtractionError('cancelled', 'closed'));
  }

  private document(): FakePdf {
    if (!this.current) {
      throw new PdfExtractionError('not-open', 'no document is open');
    }
    return this.current;
  }

  /** Waits for `resume` (resolves) or `close` (rejects with `cancelled`). */
  private pause(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.waiting = { resolve, reject };
    });
  }
}
