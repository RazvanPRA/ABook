import type { BookMetaPatch, BookRepository } from '@/repositories';
import type {
  BookId,
  BookMeta,
  Chapter,
  ChapterChunk,
  ChapterIndex,
} from '@/shared/domain';

export type RepoCall =
  | { op: 'storePdf'; id: BookId }
  | { op: 'createBook'; status: BookMeta['status'] }
  | { op: 'saveChapter'; index: number; sentences: number }
  | { op: 'saveToc'; chapters: number }
  | { op: 'updateMeta'; patch: BookMetaPatch }
  | { op: 'deleteBook'; id: BookId };

/**
 * A `BookRepository` in memory, for feature tests (features may not use the real one, even in
 * tests). `calls` logs the writes in order; the stored values are readable as the real ones.
 * The copy's fingerprint is `fp:<source uri>`, so two picks of the same URI are duplicates;
 * `failOn(op)` makes the next call of `op` reject, like a full disk.
 */
export class MemoryBookRepository implements BookRepository {
  readonly calls: RepoCall[] = [];
  readonly metas = new Map<BookId, BookMeta>();
  readonly chapters = new Map<string, ChapterChunk>();
  readonly tocs = new Map<BookId, readonly Chapter[]>();
  readonly files = new Set<string>();
  order: BookId[] = [];
  private failing: RepoCall['op'] | null = null;

  failOn(op: RepoCall['op']): void {
    this.failing = op;
  }

  /** Nothing left: no book, chapter, toc, library entry nor file. */
  isEmpty(): boolean {
    return (
      this.metas.size +
        this.chapters.size +
        this.tocs.size +
        this.files.size +
        this.order.length ===
      0
    );
  }

  private check(op: RepoCall['op']): void {
    if (this.failing === op) {
      this.failing = null;
      throw new Error(`${op} failed`);
    }
  }

  async storePdf(id: BookId, sourceUri: string) {
    this.calls.push({ op: 'storePdf', id });
    this.check('storePdf');
    const path = `/files/books/${id}.pdf`;
    this.files.add(path);
    return { path, sizeBytes: 3_800_000, fingerprint: `fp:${sourceUri}` };
  }

  async createBook(meta: BookMeta) {
    this.calls.push({ op: 'createBook', status: meta.status });
    this.check('createBook');
    this.metas.set(meta.id, meta);
    this.order = [meta.id, ...this.order];
  }

  async saveChapter(id: BookId, index: ChapterIndex, chunk: ChapterChunk) {
    this.calls.push({
      op: 'saveChapter',
      index,
      sentences: chunk.sentences.length,
    });
    this.check('saveChapter');
    this.chapters.set(`${id}:${index}`, chunk);
  }

  async saveToc(id: BookId, toc: readonly Chapter[]) {
    this.calls.push({ op: 'saveToc', chapters: toc.length });
    this.check('saveToc');
    this.tocs.set(id, toc);
  }

  async updateMeta(id: BookId, patch: BookMetaPatch) {
    this.calls.push({ op: 'updateMeta', patch });
    const meta = this.metas.get(id);
    if (!meta) {
      return null;
    }
    const next = { ...meta, ...patch };
    this.metas.set(id, next);
    return next;
  }

  async listBooks() {
    return this.order.flatMap(id => this.metas.get(id) ?? []);
  }

  async getMeta(id: BookId) {
    return this.metas.get(id) ?? null;
  }

  async getToc(id: BookId) {
    return this.tocs.get(id)?.slice() ?? null;
  }

  async getChapter(id: BookId, index: ChapterIndex) {
    return this.chapters.get(`${id}:${index}`) ?? null;
  }

  async deleteBook(id: BookId) {
    this.calls.push({ op: 'deleteBook', id });
    this.metas.delete(id);
    this.tocs.delete(id);
    this.files.delete(`/files/books/${id}.pdf`);
    this.order = this.order.filter(other => other !== id);
    [...this.chapters.keys()]
      .filter(key => key.startsWith(`${id}:`))
      .forEach(key => this.chapters.delete(key));
  }
}
