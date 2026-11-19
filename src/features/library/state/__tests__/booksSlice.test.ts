import type { BookId } from '@/shared/domain';
import { BOOK_IDS, makeMeta } from '@/shared/domain/__fixtures__/books';
import {
  bookRemoved,
  bookUpserted,
  libraryHydrated,
  libraryReducer,
  type LibraryState,
} from '../booksSlice';
import {
  selectBookById,
  selectBookCount,
  selectBooksInOrder,
} from '../selectors';

const [A, B, C] = BOOK_IDS as [BookId, BookId, BookId];
const initial = libraryReducer(undefined, { type: '@@init' });
const root = (library: LibraryState) => ({ library });
const ids = (library: LibraryState) =>
  selectBooksInOrder(root(library)).map(b => b.id);

describe('booksSlice', () => {
  it('starts empty', () => {
    expect(selectBookCount(root(initial))).toBe(0);
  });

  it('hydrates in library order, replacing what was there', () => {
    const once = libraryReducer(initial, libraryHydrated([makeMeta(A)]));
    const state = libraryReducer(
      once,
      libraryHydrated([makeMeta(C), makeMeta(B)]),
    );
    expect(ids(state)).toEqual([C, B]);
  });

  it('puts a new book first and replaces a known one in place', () => {
    let state = libraryReducer(
      initial,
      libraryHydrated([makeMeta(A), makeMeta(B)]),
    );
    state = libraryReducer(state, bookUpserted(makeMeta(C)));
    expect(ids(state)).toEqual([C, A, B]);
    state = libraryReducer(state, bookUpserted(makeMeta(B, { title: 'Nou' })));
    expect(ids(state)).toEqual([C, A, B]);
    expect(selectBookById(root(state), B)?.title).toBe('Nou');
  });

  it('removes a book, and ignores an unknown one', () => {
    let state = libraryReducer(
      initial,
      libraryHydrated([makeMeta(A), makeMeta(B)]),
    );
    state = libraryReducer(state, bookRemoved(A));
    state = libraryReducer(state, bookRemoved(C));
    expect(ids(state)).toEqual([B]);
    expect(selectBookById(root(state), A)).toBeNull();
  });
});

describe('library selectors', () => {
  it('return the same array until the library changes', () => {
    const state = root(libraryReducer(initial, libraryHydrated([makeMeta(A)])));
    expect(selectBooksInOrder(state)).toBe(selectBooksInOrder(state));
    const changed = root(libraryReducer(state.library, bookRemoved(A)));
    expect(selectBooksInOrder(changed)).not.toBe(selectBooksInOrder(state));
  });
});
