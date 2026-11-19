import type { PageText } from '@/services/text';
import { PAGES_PER_BATCH, PDF_CHUNK_BYTES } from '../limits';
import { PdfExtractionError } from '../PdfExtractionError';
import {
  createBridgeConnection,
  type BridgeConnection,
  type BridgeTimeouts,
} from './bridgeConnection';
import {
  createExtractorSessions,
  type ExtractorSessions,
} from './extractorSessions';
import { pageBatches } from './pageBatches';
import type {
  PdfBridgeTransport,
  PdfDocument,
  PdfTextExtractor,
  ReadChunk,
} from './types';

/** Base64 length of a full chunk: a shorter one is the file's last. */
const FULL_CHUNK_BASE64 = Math.ceil(PDF_CHUNK_BYTES / 3) * 4;

export interface WebViewPdfExtractorDeps {
  readonly transport: PdfBridgeTransport;
  readonly readChunk: ReadChunk;
  readonly timeouts?: BridgeTimeouts;
}

interface Context {
  readonly bridge: BridgeConnection;
  readonly readChunk: ReadChunk;
  readonly sessions: ExtractorSessions;
}

/**
 * The real extractor: pdf.js in the hidden WebView. The file goes over in 512 KB chunks (each
 * acknowledged), pages come back in batches of 5. Calls overtaken by a later `open` or `close`
 * reject with `cancelled` instead of sending more requests (`ExtractorSessions`).
 */
export function createWebViewPdfExtractor({
  transport,
  readChunk,
  timeouts,
}: WebViewPdfExtractorDeps): PdfTextExtractor {
  const bridge = createBridgeConnection(transport, timeouts);
  const context: Context = {
    bridge,
    readChunk,
    sessions: createExtractorSessions(),
  };
  return {
    open: path => openDocument(context, path),
    getPages: (from, to) => readPages(context, { from, to }),
    getOutline: async () => {
      context.sessions.openSession();
      const response = await bridge.request({
        type: 'get-outline',
        payload: {},
      });
      return response.payload.items;
    },
    close: async () => {
      context.sessions.next();
      bridge.stop();
    },
  };
}

async function openDocument(
  { bridge, readChunk, sessions }: Context,
  path: string,
): Promise<PdfDocument> {
  const owner = sessions.next();
  await bridge.start();
  sessions.guard(owner);
  const chunkCount = await sendChunks(bridge, {
    readChunk,
    path,
    guard: () => sessions.guard(owner),
  });
  const { payload } = await bridge.request({
    type: 'open',
    payload: { chunkCount, password: null },
  });
  sessions.markOpen(owner);
  const { pageCount, title, author } = payload;
  return { pageCount, info: { title, author } };
}

async function readPages(
  { bridge, sessions }: Context,
  range: { from: number; to: number },
): Promise<PageText[]> {
  const owner = sessions.openSession();
  const pages: PageText[] = [];
  for (const batch of pageBatches(range.from, range.to, PAGES_PER_BATCH)) {
    sessions.guard(owner);
    const response = await bridge.request({
      type: 'get-pages',
      payload: batch,
    });
    pages.push(...response.payload.pages);
  }
  return pages;
}

/** Sends the file chunk by chunk, each acknowledged before the next is read; returns the count. */
async function sendChunks(
  bridge: BridgeConnection,
  file: { readChunk: ReadChunk; path: string; guard: () => void },
): Promise<number> {
  const { readChunk, path, guard } = file;
  for (let index = 0; ; index++) {
    const data = await readChunk(
      path,
      index * PDF_CHUNK_BYTES,
      PDF_CHUNK_BYTES,
    );
    guard();
    if (data !== '') {
      await bridge.request({ type: 'load-chunk', payload: { index, data } });
    }
    if (data.length < FULL_CHUNK_BASE64) {
      if (index === 0 && data === '') {
        throw new PdfExtractionError('corrupt', 'the file is empty');
      }
      return data === '' ? index : index + 1;
    }
  }
}
