import type { BookId } from '@/shared/domain';

/**
 * File access for the app's own files (the imported PDFs). Paths are absolute, without `file://`.
 * Every method except `remove` and `exists` rejects when the path is missing.
 */
export interface FileStore {
  /** `DocumentDirectoryPath/books`: the only directory the app writes to. */
  booksDir(): string;
  /** `DocumentDirectoryPath/books/{id}.pdf`. */
  bookPdfPath(id: BookId): string;
  /** Creates the directory and its parents; a no-op when it exists. */
  ensureDir(path: string): Promise<void>;
  /** Copies `from` (a path, or a URI the platform can read) to `to`; the parent of `to` must exist. */
  copy(from: string, to: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  /** Size in bytes, or `null` when the file is missing. */
  size(path: string): Promise<number | null>;
  /** Names (not paths) of the entries of a directory; `[]` when it is missing. */
  list(dir: string): Promise<string[]>;
  /** Deletes a file or a directory with its content; a no-op when it is missing. */
  remove(path: string): Promise<void>;
  /**
   * Base64 of the bytes `[offset, offset + length)` of a file, cut at the end of the file (`''` from
   * the end on). Rejects when the file is missing or when `offset` / `length` is not a non-negative
   * integer. Used to send a PDF to the extractor in chunks, never whole.
   */
  readBase64(path: string, offset: number, length: number): Promise<string>;
}

/** Throws unless `offset` and `length` are non-negative integers (a programming error). */
export function assertByteRange(offset: number, length: number): void {
  if (
    !Number.isInteger(offset) ||
    !Number.isInteger(length) ||
    offset < 0 ||
    length < 0
  ) {
    throw new RangeError(`invalid byte range ${offset}+${length}`);
  }
}

export const BOOKS_DIR_NAME = 'books';
export const PDF_EXTENSION = '.pdf';
