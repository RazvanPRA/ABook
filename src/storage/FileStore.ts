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
}

export const BOOKS_DIR_NAME = 'books';
export const PDF_EXTENSION = '.pdf';
