import { selectBookContent, type BookContentRootState } from '@/features/book';
import type { BookId } from '@/shared/domain';
import type { Toc } from '../model/types';

const NONE: Toc = [];

/** The saved chapters of a book, as last read; empty until then. */
export const selectPlayerToc = (
  state: BookContentRootState,
  id: BookId | null,
): Toc => (id === null ? NONE : (selectBookContent(state, id)?.toc ?? NONE));
