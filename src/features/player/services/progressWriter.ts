import type { BookId, Progress } from '@/shared/domain';
import { logger } from '@/shared/utils';

/** While playing, progress is written at most this often (`audiobook-storage` rule 5). */
export const THROTTLE_MS = 3000;

export interface ProgressWriterPorts {
  save(id: BookId, progress: Progress): Promise<void>;
  onSaved(id: BookId, progress: Progress): void;
  now(): number;
}

export interface ProgressWriter {
  report(id: BookId, progress: Progress, urgency: 'soon' | 'now'): void;
  /** Writes what waits. Never rejects. */
  flush(): Promise<void>;
  /** Forgets what waits of a book, then waits for the write in flight. */
  drain(id: BookId): Promise<void>;
  /** The book is gone: nothing of it is written again. */
  refuse(id: BookId): void;
  isRefused(id: BookId): boolean;
  /** Something of the book was, or is being, written. */
  hasWritten(id: BookId): boolean;
}

/** Books whose progress may and may not be written. */
function createBookLedger() {
  const refused = new Set<BookId>();
  const written = new Set<BookId>();
  return {
    refuse: (id: BookId) => {
      refused.add(id);
    },
    isRefused: (id: BookId) => refused.has(id),
    hasWritten: (id: BookId) => written.has(id),
    note: (id: BookId) => {
      written.add(id);
    },
  };
}

/** Writes what waits, one write at a time, the newest of each book. */
function createWriteQueue(
  { save, onSaved, now }: ProgressWriterPorts,
  note: (id: BookId) => void,
) {
  const waiting = new Map<BookId, Progress>();
  let running: Promise<void> | null = null;
  let lastAt = -Infinity;

  const writeNext = async (id: BookId, progress: Progress) => {
    waiting.delete(id);
    note(id);
    lastAt = now();
    try {
      await save(id, progress);
      onSaved(id, progress);
      return true;
    } catch (error) {
      logger.warn('player: saving the progress failed', error);
      // The next sentence tries again at once
      lastAt = -Infinity;
      return false;
    }
  };
  const writeAll = async () => {
    let ok = true;
    while (ok) {
      const next = waiting.entries().next();
      ok = !next.done && (await writeNext(...next.value));
    }
    running = null;
  };
  return {
    waiting,
    run: () => {
      running ??= writeAll();
      return running;
    },
    idle: () => running ?? Promise.resolve(),
    /** Milliseconds until the next throttled write is allowed. */
    wait: () => Math.max(0, lastAt + THROTTLE_MS - now()),
  };
}

/**
 * Stores the listening position: at most every 3 s, or at once when asked. The trailing timer only
 * serves the foreground, since JS timers stop in background; the next sentence catches up there.
 */
export function createProgressWriter(
  ports: ProgressWriterPorts,
): ProgressWriter {
  const ledger = createBookLedger();
  const queue = createWriteQueue(ports, ledger.note);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flush = () => {
    clearTimeout(timer);
    timer = undefined;
    return queue.run();
  };
  const { refuse, isRefused, hasWritten } = ledger;
  return {
    report(id, progress, urgency) {
      if (isRefused(id)) {
        return;
      }
      queue.waiting.set(id, progress);
      if (urgency === 'now' || queue.wait() === 0) {
        flush();
      } else {
        timer ??= setTimeout(flush, queue.wait());
      }
    },
    flush,
    async drain(id) {
      queue.waiting.delete(id);
      await queue.idle();
    },
    refuse,
    isRefused,
    hasWritten,
  };
}
