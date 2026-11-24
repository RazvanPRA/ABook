import { tocSchema, type BookId } from '@/shared/domain';
import {
  FINGERPRINT_HEAD_BYTES,
  base64ToBytes,
  pdfFingerprint,
} from '@/shared/utils';
import { bookKey, type FileStore, type KeyValueStore } from '@/storage';
import { readValue } from '../readValue';
import { serialize } from '../serialize';
import type { BookRepository, StoredPdf } from './BookRepository';
import { orderEntry, readOrder, withBookFirst } from './bookOrder';
import { readChapter, saveChapter } from './chapterStore';
import { deleteBook } from './deleteBook';
import { metaEntry, readMeta, readMetas } from './metaStore';

export interface BookStores {
  kv: KeyValueStore;
  files: FileStore;
}

const storePdf = async (
  files: FileStore,
  id: BookId,
  sourceUri: string,
): Promise<StoredPdf> => {
  const path = files.bookPdfPath(id);
  await files.ensureDir(files.booksDir());
  await files.copy(sourceUri, path);
  const sizeBytes = await files.size(path);
  if (sizeBytes === null) {
    throw new Error(`Copied PDF is missing: ${path}`);
  }
  const head = await files.readBase64(path, 0, FINGERPRINT_HEAD_BYTES);
  return {
    path,
    sizeBytes,
    fingerprint: pdfFingerprint(sizeBytes, base64ToBytes(head)),
  };
};

/** `BookRepository` over AsyncStorage (metadata, text) and the file system (the PDF). */
export const createLocalBookRepository = ({
  kv,
  files,
}: BookStores): BookRepository => ({
  storePdf: (id, sourceUri) => storePdf(files, id, sourceUri),

  async createBook(meta) {
    if (meta.status !== 'processing') {
      throw new Error(`A new book starts as processing, got ${meta.status}`);
    }
    const order = await readOrder(kv);
    await kv.setMany({
      ...metaEntry(meta),
      ...orderEntry(withBookFirst(order, meta.id)),
    });
  },

  saveChapter: (id, index, chunk) => saveChapter(kv, { id, index }, chunk),

  async saveToc(id, toc) {
    const key = bookKey(id, 'toc');
    await kv.setMany({ [key]: serialize(key, tocSchema.parse(toc)) });
  },

  async updateMeta(id, patch) {
    const meta = await readMeta(kv, id);
    if (meta === null) {
      return null;
    }
    const next = { ...meta, ...patch, id };
    await kv.setMany(metaEntry(next));
    return next;
  },

  listBooks: async () => readMetas(kv, await readOrder(kv)),
  getMeta: id => readMeta(kv, id),
  hasPdf: book => files.exists(book.fileUri),
  getToc: id => readValue(kv, bookKey(id, 'toc'), tocSchema),
  getChapter: (id, index) => readChapter(kv, { id, index }),
  deleteBook: id => deleteBook({ kv, files }, id),
});
