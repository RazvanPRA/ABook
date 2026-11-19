import * as RNFS from '@dr.pogodin/react-native-fs';
import type { BookId } from '@/shared/domain';
import { BOOKS_DIR_NAME, PDF_EXTENSION, type FileStore } from './FileStore';

/** The part of `@dr.pogodin/react-native-fs` the adapter uses; injectable for tests. */
export type FsApi = Pick<
  typeof RNFS,
  | 'DocumentDirectoryPath'
  | 'copyFile'
  | 'exists'
  | 'mkdir'
  | 'readdir'
  | 'stat'
  | 'unlink'
>;

/** `FileStore` over `@dr.pogodin/react-native-fs`, rooted in the app's document directory. */
export const createReactNativeFsFileStore = (fs: FsApi = RNFS): FileStore => {
  const booksDir = `${fs.DocumentDirectoryPath}/${BOOKS_DIR_NAME}`;
  return {
    booksDir: () => booksDir,
    bookPdfPath: (id: BookId) => `${booksDir}/${id}${PDF_EXTENSION}`,
    ensureDir: path => fs.mkdir(path),
    copy: (from, to) => fs.copyFile(from, to),
    exists: path => fs.exists(path),
    async size(path) {
      return (await fs.exists(path)) ? (await fs.stat(path)).size : null;
    },
    async list(dir) {
      return (await fs.exists(dir)) ? fs.readdir(dir) : [];
    },
    async remove(path) {
      // unlink rejects on a missing path; removal is idempotent by contract
      if (await fs.exists(path)) {
        await fs.unlink(path);
      }
    },
  };
};
