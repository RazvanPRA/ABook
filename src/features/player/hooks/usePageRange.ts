import { useSelector } from 'react-redux';
import { selectPlayerBook, selectSession } from '../state/selectors';
import type { PlayerAppState } from '../model/dependencies';
import { selectPlayerToc } from '../state/tocs';

/** The current page, the book's, and those that can be gone to. */
export function usePageRange() {
  const { page, bookId } = useSelector(selectSession);
  const pageCount = useSelector(selectPlayerBook)?.pageCount ?? 0;
  const toc = useSelector((state: PlayerAppState) =>
    selectPlayerToc(state, bookId),
  ).filter(({ sentenceCount }) => sentenceCount > 0);
  const first = toc[0]?.startPage ?? 1;
  const last = toc[toc.length - 1]?.endPage ?? first;
  return {
    page: page ?? first,
    first,
    /** Of the saved chapters: an import may still bring more. */
    last,
    total: Math.max(pageCount, last),
  };
}
