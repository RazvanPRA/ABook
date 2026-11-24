import { PdfExtractionError } from '../PdfExtractionError';

/**
 * Which extractor call still counts. Every `open` and `close` starts a new session; a call that
 * was overtaken checks its session between steps and stops with `cancelled`.
 */
export interface ExtractorSessions {
  /** Starts a new session and returns it. */
  next(): number;
  /** Throws `cancelled` when `owner` is no longer the current session. */
  guard(owner: number): void;
  /** Records that the current session has a document open. */
  markOpen(owner: number): void;
  /** The current session, if it has a document open; throws `not-open` otherwise. */
  openSession(): number;
}

export function createExtractorSessions(): ExtractorSessions {
  let current = 0;
  let openedIn: number | null = null;
  const guard = (owner: number) => {
    if (owner !== current) {
      throw new PdfExtractionError('cancelled', 'extraction was cancelled');
    }
  };
  return {
    next: () => (current += 1),
    guard,
    markOpen: owner => {
      guard(owner);
      openedIn = owner;
    },
    openSession: () => {
      if (openedIn !== current) {
        throw new PdfExtractionError('not-open', 'no document is open');
      }
      return current;
    },
  };
}
