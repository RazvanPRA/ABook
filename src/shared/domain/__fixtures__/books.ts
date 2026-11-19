import { toBookId, type BookId } from '../ids';
import { bookMetaSchema, type BookMeta } from '../schemas';
import { rawMeta } from './rawValues';

/** Sample ids for tests in any layer (UUIDs, as `bookIdSchema` requires). */
export const BOOK_IDS: BookId[] = [
  '0b6f2f4e-7c1a-4d8e-9f3a-2a5b6c7d8e9f',
  '1c7a3e5f-8b2d-4c6e-9a1f-3b4c5d6e7f80',
  '2d8b4f60-9c3e-4d7f-8b20-4c5d6e7f8091',
].map(toBookId);

/** A valid meta, `processing` from page 0 unless overridden. */
export const makeMeta = (
  id: BookId,
  overrides: Partial<BookMeta> = {},
): BookMeta =>
  bookMetaSchema.parse(
    rawMeta({ id, status: 'processing', processedPages: 0, ...overrides }),
  );
