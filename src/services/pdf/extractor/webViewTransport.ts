import type { BridgeListener, PdfBridgeTransport } from './types';

/** Sends a message into the mounted WebView (`WebView.postMessage`). */
export type PostToView = (message: string) => void;

/**
 * The transport as the React host sees it. The host renders a WebView while `session()` isn't
 * `null`, keyed by it (a new session is a new WebView), attaches its `postMessage` and forwards
 * the WebView's messages and failures.
 */
export interface WebViewTransport extends PdfBridgeTransport {
  /** The current WebView session, `null` when no WebView is wanted. */
  session(): number | null;
  /** Calls `onChange` whenever `session()` changes; returns the unsubscribe function. */
  subscribe(onChange: () => void): () => void;
  /** Attaches the mounted WebView; returns the detach function. */
  attach(post: PostToView): () => void;
  /** A message from the page (`onMessage`). */
  receive(raw: string): void;
  /** The WebView failed (`onError`, `onRenderProcessGone`, …). */
  fail(reason: string): void;
}

/** A subscribe function over `set`: adds the item, returns its removal. */
const subscribeTo =
  <T>(set: Set<T>) =>
  (item: T) => {
    set.add(item);
    return () => {
      set.delete(item);
    };
  };

/** Bridges the imperative extractor and the WebView that `PdfExtractorHost` mounts. */
export function createWebViewTransport(): WebViewTransport {
  const listeners = new Set<BridgeListener>();
  const watchers = new Set<() => void>();
  let session: number | null = null;
  let sessions = 0;
  let poster: PostToView | null = null;

  const setSession = (next: number | null) => {
    session = next;
    poster = null;
    watchers.forEach(watch => watch());
  };
  const fail = (reason: string) =>
    listeners.forEach(listener => listener.failure(reason));

  return {
    mount: () => setSession((sessions += 1)),
    unmount: () => {
      if (session !== null) {
        setSession(null);
      }
    },
    post: message => (poster ? poster(message) : fail('WebView not attached')),
    listen: subscribeTo(listeners),
    session: () => session,
    subscribe: subscribeTo(watchers),
    attach: post => {
      poster = post;
      return () => {
        if (poster === post) {
          poster = null;
        }
      };
    },
    receive: raw => listeners.forEach(listener => listener.message(raw)),
    fail,
  };
}
