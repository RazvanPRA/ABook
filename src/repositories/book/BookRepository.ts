import type {
  BookId,
  BookMeta,
  Chapter,
  ChapterChunk,
  ChapterIndex,
} from '@/shared/domain';

export interface StoredPdf {
  /** Absolute path of the app's copy, to store as `BookMeta.fileUri`. */
  path: string;
  sizeBytes: number;
  /** `pdfFingerprint` of the copy, for the duplicate check. */
  fingerprint: string;
}

/** Everything in `BookMeta` except its identity can change after import. */
export type BookMetaPatch = Partial<Omit<BookMeta, 'id'>>;

/**
 * A book's file, metadata, table of contents and chapter text. The import writes in this order:
 * `storePdf` → `createBook` (`processing`) → `saveChapter`… → `saveToc` → `updateMeta` (`ready`),
 * so a crash at any point leaves a `processing` book whose saved chapters are readable.
 */
export interface BookRepository {
  /** Copies the picked file to `books/{id}.pdf` and fingerprints the copy. */
  storePdf(id: BookId, sourceUri: string): Promise<StoredPdf>;
  /** Writes the `processing` meta and puts the book first in the library, in one batch. */
  createBook(meta: BookMeta): Promise<void>;
  /** Writes one chapter, split into parts when it exceeds the value limit. */
  saveChapter(
    id: BookId,
    index: ChapterIndex,
    chunk: ChapterChunk,
  ): Promise<void>;
  saveToc(id: BookId, toc: readonly Chapter[]): Promise<void>;
  /** Merges the patch into the stored meta; `null` when the book has no valid meta. */
  updateMeta(id: BookId, patch: BookMetaPatch): Promise<BookMeta | null>;
  /** Books in library order; ids without a valid meta are skipped. */
  listBooks(): Promise<BookMeta[]>;
  getMeta(id: BookId): Promise<BookMeta | null>;
  getToc(id: BookId): Promise<Chapter[] | null>;
  /** The whole chapter, joined from its parts; `null` when missing or any part is invalid. */
  getChapter(id: BookId, index: ChapterIndex): Promise<ChapterChunk | null>;
  /** Removes the book from the library, then every key with its prefix, then its file. */
  deleteBook(id: BookId): Promise<void>;
}
