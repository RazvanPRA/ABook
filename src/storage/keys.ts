import { bookIdSchema, type BookId, type ChapterIndex } from '@/shared/domain';

/**
 * The only place where storage keys are written as strings (lint rejects `abk:` literals elsewhere).
 * Key table: `.claude/skills/audiobook-storage/SKILL.md`.
 */
export const NAMESPACE = 'abk:';

export type RootKeyName = 'books' | 'settings' | 'schemaVersion';
export type BookKeyName = 'meta' | 'toc' | 'progress' | 'bookmarks';

const BOOK_SEGMENT = `${NAMESPACE}book:`;

export const rootKey = (name: RootKeyName): string => `${NAMESPACE}${name}`;

/** Every key of a book starts with this prefix, so deletion can find them all. */
export const bookPrefix = (id: BookId): string => `${BOOK_SEGMENT}${id}:`;

export const bookKey = (id: BookId, name: BookKeyName): string =>
  `${bookPrefix(id)}${name}`;

/** `ch:{n}` holds a chunk or a parts manifest; `ch:{n}:p:{k}` holds part `k`. */
export const chapterKey = (
  id: BookId,
  chapter: ChapterIndex,
  part?: number,
): string => {
  const base = `${bookPrefix(id)}ch:${chapter}`;
  return part === undefined ? base : `${base}:p:${part}`;
};

/** Prefix shared by `ch:{n}:p:0…k`; ends with `:` so chapter 1 never matches chapter 10. */
export const chapterPartsPrefix = (id: BookId, chapter: ChapterIndex): string =>
  `${chapterKey(id, chapter)}:p:`;

export const isNamespaced = (key: string): boolean => key.startsWith(NAMESPACE);

/** Guards every write path: a key outside the namespace is a programming error. */
export const assertNamespaced = (keys: readonly string[]): void => {
  const foreign = keys.find(key => !isNamespaced(key));
  if (foreign !== undefined) {
    throw new Error(
      `Storage key outside the ${NAMESPACE} namespace: ${foreign}`,
    );
  }
};

/** The book a key belongs to, or `null` for root keys, foreign keys and malformed ids. */
export const bookIdFromKey = (key: string): BookId | null => {
  if (!key.startsWith(BOOK_SEGMENT)) {
    return null;
  }
  const end = key.indexOf(':', BOOK_SEGMENT.length);
  if (end === -1) {
    return null;
  }
  const parsed = bookIdSchema.safeParse(key.slice(BOOK_SEGMENT.length, end));
  return parsed.success ? parsed.data : null;
};

export const isMetaKey = (key: string): boolean => {
  const id = bookIdFromKey(key);
  return id !== null && key === bookKey(id, 'meta');
};
