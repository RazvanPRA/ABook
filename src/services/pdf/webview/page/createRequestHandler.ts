import { MAX_PAGES_PER_REQUEST } from '../../limits';
import type { PageErrorCode } from '../../PdfExtractionError';
import type { WebViewRequest, WebViewResponse } from '../../protocol/messages';
import { groupLines } from './groupLines';
import type { PdfJsDocument, PdfJsLib } from './pdfJsTypes';
import { readOutline } from './readOutline';

// Runs inside the WebView (compiled by scripts/build-pdf-webview.js). The build strips the imports
// and concatenates the page files, so every value import above must be in the build's file list.

/** pdf.js exceptions (by `name`) that mean the file isn't a readable PDF. */
const CORRUPT_ERRORS = new Set([
  'InvalidPDFException',
  'MissingPDFException',
  'UnexpectedResponseException',
  'FormatError',
]);

export interface HandlerDeps {
  readonly lib: PdfJsLib;
  readonly decodeBase64: (data: string) => Uint8Array;
}

interface State {
  readonly chunks: Map<number, Uint8Array>;
  doc: PdfJsDocument | null;
}

class PageError extends Error {
  readonly code: PageErrorCode;

  constructor(code: PageErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

/** Answers RN's requests; never rejects: failures become `error` responses. */
export function createRequestHandler(
  deps: HandlerDeps,
): (request: WebViewRequest) => Promise<WebViewResponse> {
  const state: State = { chunks: new Map(), doc: null };
  return async request => {
    try {
      return await respond(request, state, deps);
    } catch (error) {
      return {
        type: 'error',
        requestId: request.requestId,
        payload: { code: errorCode(error), message: errorMessage(error) },
      };
    }
  };
}

async function respond(
  request: WebViewRequest,
  state: State,
  deps: HandlerDeps,
): Promise<WebViewResponse> {
  const { requestId } = request;
  switch (request.type) {
    case 'load-chunk':
      return {
        type: 'chunk-loaded',
        requestId,
        payload: loadChunk(request.payload, state, deps),
      };
    case 'open':
      return {
        type: 'opened',
        requestId,
        payload: await open(request.payload, state, deps.lib),
      };
    case 'get-pages':
      return {
        type: 'pages',
        requestId,
        payload: { pages: await getPages(request.payload, state) },
      };
    case 'get-outline':
      return {
        type: 'outline',
        requestId,
        payload: { items: await getOutline(state) },
      };
    case 'close':
      await closeDocument(state);
      return { type: 'closed', requestId, payload: {} };
  }
}

function loadChunk(
  payload: { index: number; data: string },
  state: State,
  deps: HandlerDeps,
) {
  state.chunks.set(payload.index, deps.decodeBase64(payload.data));
  return { index: payload.index, received: state.chunks.size };
}

async function getOutline(state: State) {
  const doc = openDocument(state);
  return readOutline(doc, (await doc.getOutline()) ?? []);
}

async function open(
  payload: { chunkCount: number; password: string | null },
  state: State,
  lib: PdfJsLib,
) {
  const data = joinChunks(state.chunks, payload.chunkCount);
  state.chunks.clear();
  await closeDocument(state);
  const doc = await lib.getDocument({
    data,
    password: payload.password ?? undefined,
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;
  state.doc = doc;
  const { info } = await doc.getMetadata().catch(() => ({ info: null }));
  return {
    pageCount: doc.numPages,
    title: infoText(info, 'Title'),
    author: infoText(info, 'Author'),
  };
}

function joinChunks(
  chunks: Map<number, Uint8Array>,
  count: number,
): Uint8Array {
  const parts: Uint8Array[] = [];
  for (let index = 0; index < count; index++) {
    const part = chunks.get(index);
    if (!part) {
      throw new PageError(
        'bad-request',
        `chunk ${index} of ${count} is missing`,
      );
    }
    parts.push(part);
  }
  const data = new Uint8Array(
    parts.reduce((sum, part) => sum + part.length, 0),
  );
  let offset = 0;
  for (const part of parts) {
    data.set(part, offset);
    offset += part.length;
  }
  return data;
}

async function getPages(range: { from: number; to: number }, state: State) {
  const doc = openDocument(state);
  const { from, to } = range;
  if (
    from < 1 ||
    to > doc.numPages ||
    from > to ||
    to - from + 1 > MAX_PAGES_PER_REQUEST
  ) {
    throw new PageError('bad-request', `invalid page range ${from}-${to}`);
  }
  const pages = [];
  for (let number = from; number <= to; number++) {
    const page = await doc.getPage(number);
    const { height } = page.getViewport({ scale: 1 });
    const { items } = await page.getTextContent();
    pages.push({ page: number, lines: groupLines(items, height) });
    page.cleanup();
  }
  return pages;
}

function openDocument(state: State): PdfJsDocument {
  if (!state.doc) {
    throw new PageError('not-open', 'no document is open');
  }
  return state.doc;
}

async function closeDocument(state: State): Promise<void> {
  const { doc } = state;
  state.doc = null;
  await doc?.destroy();
}

function infoText(info: unknown, key: string): string | null {
  const value =
    typeof info === 'object' && info !== null
      ? (info as Record<string, unknown>)[key]
      : undefined;
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function errorCode(error: unknown): PageErrorCode {
  if (error instanceof PageError) {
    return error.code;
  }
  const name = error instanceof Error ? error.name : '';
  if (name === 'PasswordException') {
    return 'password';
  }
  return CORRUPT_ERRORS.has(name) ? 'corrupt' : 'unknown';
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
