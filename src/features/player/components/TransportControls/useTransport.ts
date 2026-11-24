import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { usePageRange } from '../../hooks/usePageRange';
import { usePlayerDispatch } from '../../hooks/usePlayerDispatch';
import type { PlayerAppState } from '../../model/dependencies';
import { nextPosition, previousPosition } from '../../services/position';
import { selectSession } from '../../state/selectors';
import { seekPage, seekSentence, togglePlayback } from '../../state/thunks';
import { selectPlayerToc } from '../../state/tocs';

/** The five controls: what they do and whether there is somewhere to go. */
export function useTransport() {
  const dispatch = usePlayerDispatch();
  const { page, first, last } = usePageRange();
  const { status, waiting, position, bookId } = useSelector(selectSession);
  const toc = useSelector((state: PlayerAppState) =>
    selectPlayerToc(state, bookId),
  );
  const can = {
    previousPage: page > first,
    nextPage: page < last,
    previousSentence:
      position !== null && previousPosition(toc, position) !== null,
    nextSentence: position !== null && nextPosition(toc, position) !== null,
  };
  const actions = useMemo(
    () => ({
      previousPage: () => dispatch(seekPage(page - 1)),
      nextPage: () => dispatch(seekPage(page + 1)),
      previousSentence: () => dispatch(seekSentence(-1)),
      nextSentence: () => dispatch(seekSentence(1)),
      toggle: () => dispatch(togglePlayback()),
    }),
    [dispatch, page],
  );
  return { playing: status === 'playing' || waiting, can, actions };
}
