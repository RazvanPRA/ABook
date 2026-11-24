import type { BookWithProgress } from '../model/types';

/** Last played first, then the never-played ones; ties keep the library order. */
export function sortByLastPlayed(
  items: readonly BookWithProgress[],
): BookWithProgress[] {
  const playedAt = ({ progress }: BookWithProgress) =>
    progress === null ? 0 : Date.parse(progress.updatedAt);
  return [...items].sort((a, b) => playedAt(b) - playedAt(a));
}
