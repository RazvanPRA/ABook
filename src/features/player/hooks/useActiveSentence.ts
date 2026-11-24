import { useSelector } from 'react-redux';
import { clamp } from '@/shared/utils';
import type { PlayerRootState } from '../state/playerSlice';
import type { Paragraph } from '../model/types';

/**
 * The active sentence as this paragraph sees it: its place inside, -1 before it is reached, the
 * paragraph's length once passed. So a change re-renders only the paragraphs it enters or leaves.
 */
export function useActiveSentence(
  chapter: number,
  { first, end }: Paragraph,
): number {
  return useSelector(({ player }: PlayerRootState) => {
    const { position } = player.session;
    return position?.chapter === chapter
      ? clamp(position.sentence - first, -1, end - first)
      : -1;
  });
}
