import * as RNFS from '@dr.pogodin/react-native-fs';
import { toBookId } from '@/shared/domain';
import type { FileStore } from '../FileStore';
import { createReactNativeFsFileStore } from '../reactNativeFsFileStore';
import { InMemoryFileStore } from '../testing';

/** The jest.setup.js mock adds two helpers to the module. */
type FsMock = typeof RNFS & {
  __reset(): void;
  __writeFile(path: string, size: number): void;
};
const fsMock = jest.requireMock<FsMock>('@dr.pogodin/react-native-fs');

const ID = toBookId('0b6f2f4e-7c1a-4d8e-9f3a-2a5b6c7d8e9f');
const SOURCE = '/cache/picked/carte.pdf';
const SIZE = 1_234_567;

/** Each implementation, with the picked PDF already present at SOURCE. */
const implementations: [string, () => FileStore][] = [
  [
    'InMemoryFileStore',
    () => {
      const store = new InMemoryFileStore();
      store.addFile(SOURCE, SIZE);
      return store;
    },
  ],
  [
    'reactNativeFsFileStore',
    () => {
      fsMock.__reset();
      fsMock.__writeFile(SOURCE, SIZE);
      return createReactNativeFsFileStore();
    },
  ],
];

describe.each(implementations)('%s (FileStore contract)', (_name, create) => {
  let store: FileStore;
  let pdf: string;
  beforeEach(() => {
    store = create();
    pdf = store.bookPdfPath(ID);
  });

  it('places PDFs in books/{id}.pdf', () => {
    expect(pdf).toBe(`${store.booksDir()}/${ID}.pdf`);
  });

  it('copies a file into an ensured directory and reports its size', async () => {
    await store.ensureDir(store.booksDir());
    await store.ensureDir(store.booksDir()); // idempotent
    await store.copy(SOURCE, pdf);
    expect(await store.exists(pdf)).toBe(true);
    expect(await store.size(pdf)).toBe(SIZE);
    expect(await store.list(store.booksDir())).toEqual([`${ID}.pdf`]);
  });

  it('rejects a copy into a missing directory or from a missing file', async () => {
    await expect(store.copy(SOURCE, pdf)).rejects.toThrow();
    await store.ensureDir(store.booksDir());
    await expect(store.copy('/cache/missing.pdf', pdf)).rejects.toThrow();
    expect(await store.exists(pdf)).toBe(false);
  });

  it('reports missing files as null size and an empty listing', async () => {
    expect(await store.size(pdf)).toBeNull();
    expect(await store.list(store.booksDir())).toEqual([]);
  });

  it('removes files and directories, and ignores missing ones', async () => {
    await store.ensureDir(store.booksDir());
    await store.copy(SOURCE, pdf);
    await store.remove(pdf);
    await expect(store.remove(pdf)).resolves.toBeUndefined();
    expect(await store.exists(pdf)).toBe(false);

    await store.copy(SOURCE, pdf);
    await store.remove(store.booksDir());
    expect(await store.exists(store.booksDir())).toBe(false);
    expect(await store.exists(pdf)).toBe(false);
    expect(await store.exists(SOURCE)).toBe(true);
  });
});

describe('reactNativeFsFileStore', () => {
  it('is rooted in the document directory', () => {
    expect(createReactNativeFsFileStore().booksDir()).toBe(
      `${RNFS.DocumentDirectoryPath}/books`,
    );
  });
});

describe('InMemoryFileStore test helpers', () => {
  it('fails only the next write of the chosen operation', async () => {
    const store = new InMemoryFileStore();
    store.addFile(SOURCE, SIZE);
    await store.ensureDir(store.booksDir());
    store.failNext('copy');
    const pdf = store.bookPdfPath(ID);
    await expect(store.copy(SOURCE, pdf)).rejects.toThrow(/copy/);
    expect(await store.exists(pdf)).toBe(false);
    await store.copy(SOURCE, pdf);
    expect(store.filePaths()).toEqual([pdf, SOURCE].sort());
    expect(store.calls.map(c => c.operation)).toEqual([
      'ensureDir',
      'copy',
      'copy',
    ]);
  });
});
