import {
  isPdfExtractionError,
  type PdfDocument,
  type PdfTextExtractor,
} from '@/services/pdf';
import {
  HEADER_SAMPLE_PAGES,
  chaptersFromOutline,
  detectRepeatedHeaders,
  expandLigatures,
  joinHyphenatedWords,
  normalizeDiacritics,
  fixedPageChapters,
  normalizeWhitespace,
  stripChapterRunningHeaders,
  stripPageNumbers,
  stripRepeatedHeaders,
  type OutlineItem,
  type PageText,
} from '@/services/text';

/** Pages asked for per call, as the import pipeline will (PROMPT §5). */
const BATCH = 5;
const PROGRESS_EVERY_PAGES = 50;

export interface ProbeProgress {
  readonly phase: 'deschidere' | 'pages' | 'curățare';
  readonly page: number;
  readonly total: number;
}

export interface ProbeResult {
  readonly document: PdfDocument;
  readonly outlineCount: number;
  /** Chapters the per-chapter header rules ran on (outline, else every 10 pages). */
  readonly chapterCount: number;
  readonly openMs: number;
  readonly extractMs: number;
  readonly slowestBatchMs: number;
  readonly cleanMs: number;
  readonly rawPages: readonly PageText[];
  /** After headers / footers and page numbers only: `removedLines` compares against these. */
  readonly strippedPages: readonly PageText[];
  /** After headers / footers, page numbers and hyphenation (the step 2–3 cleanup). */
  readonly cleanPages: readonly PageText[];
  readonly headerCount: number;
  /**
   * Band lines that still repeat on ≥ 50% of all pages after cleanup (signatures, digits as #):
   * what the 20-page sample missed and TTS would read on every page.
   */
  readonly leftoverHeaders: readonly string[];
}

export type ProbeOutcome =
  | { readonly ok: true; readonly result: ProbeResult }
  | { readonly ok: false; readonly code: string; readonly message: string };

const now = () => Date.now();
const yieldToJs = () => new Promise(resolve => setTimeout(resolve, 0));

/** Dev only: opens a PDF, extracts every page in batches of 5 and times it (abook://dev/pdf). */
export async function runPdfProbe(
  extractor: PdfTextExtractor,
  path: string,
  onProgress: (progress: ProbeProgress) => void,
): Promise<ProbeOutcome> {
  try {
    const started = now();
    onProgress({ phase: 'deschidere', page: 0, total: 0 });
    const document = await extractor.open(path);
    const outline = await extractor.getOutline();
    const openMs = now() - started;
    const extraction = await extractAll(
      extractor,
      document.pageCount,
      onProgress,
    );
    onProgress({
      phase: 'curățare',
      page: document.pageCount,
      total: document.pageCount,
    });
    await yieldToJs();
    const cleanStarted = now();
    const { headers, chapterCount, strippedPages, cleanPages } = cleanAll(
      extraction.pages,
      outline,
    );
    const cleanMs = now() - cleanStarted;
    return {
      ok: true,
      result: {
        document,
        outlineCount: outline.length,
        chapterCount,
        openMs,
        extractMs: extraction.ms,
        slowestBatchMs: extraction.slowestMs,
        cleanMs,
        rawPages: extraction.pages,
        strippedPages,
        cleanPages,
        headerCount: headers.size,
        leftoverHeaders: [...detectRepeatedHeaders(cleanPages)],
      },
    };
  } catch (error) {
    return {
      ok: false,
      code: isPdfExtractionError(error) ? error.code : 'other',
      message: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await extractor.close();
  }
}

/**
 * The cleanup as the import will run it: book headers learned from the first pages, then the
 * per-chapter running heads (step 11a), then page numbers and hyphenation.
 */
function cleanAll(pages: readonly PageText[], outline: readonly OutlineItem[]) {
  const headers = detectRepeatedHeaders(pages.slice(0, HEADER_SAMPLE_PAGES));
  const bookClean = stripRepeatedHeaders(pages, headers);
  const chapters =
    chaptersFromOutline(outline, pages.length) ??
    fixedPageChapters(pages.length);
  const chapterClean = chapters.flatMap(({ startPage, endPage }) =>
    stripChapterRunningHeaders(bookClean.slice(startPage - 1, endPage)),
  );
  const strippedPages = stripPageNumbers(chapterClean);
  return {
    headers,
    chapterCount: chapters.length,
    strippedPages,
    cleanPages: joinHyphenatedWords(strippedPages),
  };
}

async function extractAll(
  extractor: PdfTextExtractor,
  total: number,
  onProgress: (progress: ProbeProgress) => void,
) {
  const pages: PageText[] = [];
  const started = now();
  let slowestMs = 0;
  for (let from = 1; from <= total; from += BATCH) {
    const batchStart = now();
    pages.push(
      ...(await extractor.getPages(from, Math.min(from + BATCH - 1, total))),
    );
    slowestMs = Math.max(slowestMs, now() - batchStart);
    // Progress every 10 batches, and no setTimeout(0) between batches: awaiting the bridge already
    // frees the JS thread, and re-rendering on every batch doubled the extraction time (step 11).
    if (pages.length % PROGRESS_EVERY_PAGES === 0 || pages.length === total) {
      onProgress({ phase: 'pages', page: pages.length, total });
    }
  }
  return { pages, ms: now() - started, slowestMs };
}

/** The text of one page as TTS would get it: lines joined, then normalized. */
export function pageText(page: PageText | undefined): string {
  const text = (page?.lines ?? []).map(line => line.text).join('\n');
  return normalizeWhitespace(expandLigatures(normalizeDiacritics(text)));
}

/** The lines the cleanup removed from page `index` (headers, footers, page numbers). */
export function removedLines(result: ProbeResult, index: number): string[] {
  const kept = new Set(result.strippedPages[index]?.lines ?? []);
  return (result.rawPages[index]?.lines ?? [])
    .filter(line => !kept.has(line))
    .map(line => `${line.text} (y ${line.y.toFixed(3)})`);
}
