import { base64ToBytes, bytesToBase64 } from '@/shared/utils';
import type { WebViewRequest } from '../protocol/messages';
import type {
  BridgeListener,
  PdfBridgeTransport,
  ReadChunk,
} from '../extractor/types';
import { createRequestHandler } from '../webview/page/createRequestHandler';
import { parseRequest } from '../webview/page/parseRequest';
import type { PdfJsDocument, PdfJsLib } from '../webview/page/pdfJsTypes';

export interface PageTransportOptions {
  readonly pageCount?: number;
  /** `getDocument` rejects with this (an `Error` named like the pdf.js exception). */
  readonly openError?: Error;
  /** The page doesn't boot by itself; the test calls `boot()` or `bootError()`. */
  readonly manualBoot?: boolean;
}

export function pdfJsException(name: string, message = name): Error {
  const error = new Error(message);
  error.name = name;
  return error;
}

function fakeDocument(pageCount: number): PdfJsDocument {
  return {
    numPages: pageCount,
    getPage: async number => ({
      getViewport: () => ({ height: 800 }),
      getTextContent: async () => ({
        items: [
          { str: `Pagina ${number}`, transform: [11, 0, 0, 11, 72, 700] },
        ],
      }),
      cleanup: () => undefined,
    }),
    getMetadata: async () => ({
      info: { Title: 'Ion', Author: 'Liviu Rebreanu' },
    }),
    getOutline: async () => [{ title: 'Capitolul 1', dest: null, items: [] }],
    getDestination: async () => null,
    getPageIndex: async () => 0,
    destroy: async () => undefined,
  };
}

function fakeLib(
  options: PageTransportOptions,
  opened: Uint8Array[],
): PdfJsLib {
  const { pageCount = 12, openError } = options;
  return {
    version: 'test',
    getDocument: params => {
      opened.push(params.data);
      return {
        promise: openError
          ? Promise.reject(openError)
          : Promise.resolve(fakeDocument(pageCount)),
      };
    },
  };
}

/** The fake WebView: the page handler, restarted on every mount, and what reached it. */
interface FakeWebView {
  readonly listeners: Set<BridgeListener>;
  readonly requests: WebViewRequest[];
  readonly held: Set<WebViewRequest['type']>;
  readonly state: { mounts: number; unmounts: number; mounted: boolean };
  readonly emit: (message: object) => void;
  readonly boot: () => void;
}

function transportOver(
  web: FakeWebView,
  lib: PdfJsLib,
  manualBoot: boolean,
): PdfBridgeTransport {
  const { state } = web;
  let handle = createRequestHandler({ lib, decodeBase64: base64ToBytes });
  return {
    mount: () => {
      state.mounts += 1;
      state.mounted = true;
      handle = createRequestHandler({ lib, decodeBase64: base64ToBytes });
      if (!manualBoot) {
        Promise.resolve().then(web.boot);
      }
    },
    unmount: () => {
      state.unmounts += 1;
      state.mounted = false;
    },
    post: message => {
      const request = parseRequest(JSON.parse(message));
      if (!request) {
        throw new Error(`invalid request ${message}`);
      }
      web.requests.push(request);
      if (!web.held.has(request.type)) {
        handle(request).then(web.emit);
      }
    },
    listen: listener => {
      web.listeners.add(listener);
      return () => web.listeners.delete(listener);
    },
  };
}

/**
 * A transport whose "WebView" is the real page handler over a fake pdf.js, so the extractor is
 * tested against the page's actual answers. `hold(type)` makes the page stop answering that
 * request type (timeouts, cancel mid-batch); every request RN posted is kept in `requests`.
 */
export function createPageTransport(options: PageTransportOptions = {}) {
  const listeners = new Set<BridgeListener>();
  const emit = (message: object) =>
    listeners.forEach(listener => listener.message(JSON.stringify(message)));
  const web: FakeWebView = {
    listeners,
    requests: [],
    held: new Set(),
    state: { mounts: 0, unmounts: 0, mounted: false },
    emit,
    boot: () =>
      emit({ type: 'ready', requestId: null, payload: { version: 'test' } }),
  };
  const opened: Uint8Array[] = [];
  const lib = fakeLib(options, opened);
  return {
    transport: transportOver(web, lib, options.manualBoot ?? false),
    state: web.state,
    requests: web.requests,
    opened,
    hold: (type: WebViewRequest['type']) => web.held.add(type),
    boot: web.boot,
    bootError: (message: string) =>
      emit({
        type: 'error',
        requestId: null,
        payload: { code: 'boot', message },
      }),
    fail: (reason: string) =>
      listeners.forEach(listener => listener.failure(reason)),
  };
}

/** A `ReadChunk` over the bytes of one file at `path`; other paths reject like a missing file. */
export function readChunkOf(
  path: string,
  bytes: Uint8Array,
): ReadChunk & { calls: number } {
  const read = async (asked: string, offset: number, length: number) => {
    read.calls += 1;
    if (asked !== path) {
      throw new Error(`ENOENT: ${asked}`);
    }
    return bytesToBase64(bytes.subarray(offset, offset + length));
  };
  read.calls = 0;
  return read;
}

/** `size` bytes with a recognizable pattern. */
export function sampleBytes(size: number): Uint8Array {
  return Uint8Array.from({ length: size }, (_, index) => (index * 7) % 251);
}
