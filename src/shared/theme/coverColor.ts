import type { BookId } from '@/shared/domain';
import { color } from './colors';

const UINT32 = 2 ** 32;

/** djb2 string hash (hash * 33 + char), kept in the unsigned 32-bit range without bitwise ops. */
const djb2 = (value: string): number => {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33 + value.charCodeAt(i)) % UINT32;
  }
  return hash;
};

/** Deterministic cover color for a book: the same id always gets the same color. */
export const pickCoverColor = (id: BookId): string =>
  color.cover[djb2(id) % color.cover.length] ?? color.cover[0];
