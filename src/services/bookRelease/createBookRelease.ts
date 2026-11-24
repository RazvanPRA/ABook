import type { BookId } from '@/shared/domain';

/** `deleted`: nothing of the book may be written again. `restarted`: its position is forgotten. */
export type ReleaseReason = 'deleted' | 'restarted';

type ReleaseHandler = (id: BookId, reason: ReleaseReason) => Promise<void>;

/**
 * Who uses a book (the player) lets go of it before its keys are removed, so that no late write
 * brings one back. The one who asks (the book feature) doesn't know who that is.
 */
export interface BookRelease {
  /** Returns the unregister. */
  onRelease(handler: ReleaseHandler): () => void;
  /** Resolves once every handler is done with the book. */
  release: ReleaseHandler;
}

export function createBookRelease(): BookRelease {
  const handlers = new Set<ReleaseHandler>();
  return {
    onRelease(handler) {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
    async release(id, reason) {
      await Promise.all([...handlers].map(handler => handler(id, reason)));
    },
  };
}
