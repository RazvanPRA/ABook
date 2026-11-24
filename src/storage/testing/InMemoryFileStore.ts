import type { BookId } from '@/shared/domain';
import { bytesToBase64 } from '@/shared/utils';
import {
  BOOKS_DIR_NAME,
  PDF_EXTENSION,
  assertByteRange,
  type FileStore,
} from '../FileStore';

export type FileOperation = 'ensureDir' | 'copy' | 'remove';

export interface FileCall {
  operation: FileOperation;
  path: string;
}

const ROOT = '/documents';
const parentOf = (path: string): string => path.slice(0, path.lastIndexOf('/'));
const isUnder = (path: string, dir: string): boolean =>
  path.startsWith(`${dir}/`);

/**
 * Test double for `FileStore`: files are byte arrays in a map. Records writes (for write-order
 * checks across both stores) and can fail the next write of an operation, to simulate a crash.
 */
export class InMemoryFileStore implements FileStore {
  readonly calls: FileCall[] = [];
  private readonly files = new Map<string, Uint8Array>();
  private readonly dirs = new Set<string>([ROOT]);
  private readonly pendingFailures = new Set<FileOperation>();

  /** Seeds a file, e.g. the picked PDF the import copies from: its bytes, or a size (zero bytes). */
  addFile(path: string, content: number | Uint8Array): void {
    this.files.set(
      path,
      typeof content === 'number' ? new Uint8Array(content) : content,
    );
  }

  failNext(operation: FileOperation): void {
    this.pendingFailures.add(operation);
  }

  /** Paths of every file, sorted, for assertions. */
  filePaths(): string[] {
    return [...this.files.keys()].sort();
  }

  booksDir(): string {
    return `${ROOT}/${BOOKS_DIR_NAME}`;
  }

  bookPdfPath(id: BookId): string {
    return `${this.booksDir()}/${id}${PDF_EXTENSION}`;
  }

  async ensureDir(path: string) {
    this.record('ensureDir', path);
    for (let p = path; p.length > 0; p = parentOf(p)) {
      this.dirs.add(p);
    }
  }

  async copy(from: string, to: string) {
    this.record('copy', to);
    const content = this.files.get(from);
    if (content === undefined || !this.dirs.has(parentOf(to))) {
      throw new Error(`ENOENT: ${content === undefined ? from : parentOf(to)}`);
    }
    this.files.set(to, content);
  }

  async exists(path: string) {
    return this.files.has(path) || this.dirs.has(path);
  }

  async size(path: string) {
    return this.files.get(path)?.length ?? null;
  }

  async list(dir: string) {
    const children = [...this.files.keys(), ...this.dirs].filter(
      path => parentOf(path) === dir,
    );
    return children.map(path => path.slice(dir.length + 1));
  }

  async remove(path: string) {
    this.record('remove', path);
    this.files.delete(path);
    [...this.files.keys()]
      .filter(file => isUnder(file, path))
      .forEach(file => this.files.delete(file));
    [...this.dirs]
      .filter(dir => dir === path || isUnder(dir, path))
      .forEach(dir => this.dirs.delete(dir));
  }

  async readBase64(path: string, offset: number, length: number) {
    assertByteRange(offset, length);
    const content = this.files.get(path);
    if (content === undefined) {
      throw new Error(`ENOENT: ${path}`);
    }
    return bytesToBase64(content.subarray(offset, offset + length));
  }

  private record(operation: FileOperation, path: string): void {
    this.calls.push({ operation, path });
    if (this.pendingFailures.delete(operation)) {
      throw new Error(`Simulated ${operation} failure`);
    }
  }
}
