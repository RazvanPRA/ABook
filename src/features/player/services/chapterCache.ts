import type { ChapterChunk, ChapterIndex } from '@/shared/domain';

/** Chapters kept in memory (PROMPT §6). */
export const CACHED_CHAPTERS = 3;

export interface ChapterCache {
  /** `null`: missing or invalid. Rejects when storage fails. Only text is kept; the rest is retried. */
  get(chapter: ChapterIndex): Promise<ChapterChunk | null>;
  /** The chapter, if it is in memory. */
  peek(chapter: ChapterIndex): ChapterChunk | null;
  /** Reads ahead; a failure is left for `get` to report. */
  prefetch(chapter: ChapterIndex): void;
  clear(): void;
}

type ReadChapter = (chapter: ChapterIndex) => Promise<ChapterChunk | null>;

/** The last used chapters, the oldest use first (a `Map` keeps the order of insertion). */
function createRecent(capacity: number) {
  const kept = new Map<ChapterIndex, ChapterChunk>();
  return {
    peek: (chapter: ChapterIndex) => kept.get(chapter) ?? null,
    use: (chapter: ChapterIndex, chunk: ChapterChunk) => {
      kept.delete(chapter);
      kept.set(chapter, chunk);
      const [oldest] = kept.keys();
      if (kept.size > capacity && oldest !== undefined) {
        kept.delete(oldest);
      }
    },
    clear: () => kept.clear(),
  };
}

/** The last used chapters of a book; each is read once, however many ask for it meanwhile. */
export function createChapterCache(
  read: ReadChapter,
  capacity: number = CACHED_CHAPTERS,
): ChapterCache {
  const recent = createRecent(capacity);
  const reading = new Map<ChapterIndex, Promise<ChapterChunk | null>>();

  const load = async (chapter: ChapterIndex) => {
    try {
      const chunk = await read(chapter);
      // After a clear, this read is nobody's any more
      if (chunk && chunk.sentences.length > 0 && reading.has(chapter)) {
        recent.use(chapter, chunk);
      }
      return chunk;
    } finally {
      reading.delete(chapter);
    }
  };

  const get = async (chapter: ChapterIndex) => {
    const own = recent.peek(chapter);
    if (own) {
      recent.use(chapter, own);
      return own;
    }
    const pending = reading.get(chapter) ?? load(chapter);
    reading.set(chapter, pending);
    return pending;
  };

  return {
    get,
    peek: recent.peek,
    prefetch: chapter => {
      get(chapter).catch(() => {});
    },
    clear: () => {
      recent.clear();
      reading.clear();
    },
  };
}
