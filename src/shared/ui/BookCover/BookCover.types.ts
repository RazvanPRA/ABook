import type { BookId } from '@/shared/domain';

/** `sm`: 48×64 in the library list. `lg`: 160×220 on the book details screen. */
export type BookCoverSize = 'sm' | 'lg';

export interface BookCoverProps {
  /** Picks the cover color deterministically. */
  id: BookId;
  title: string;
  author?: string;
  size?: BookCoverSize;
  /**
   * Already translated description ("Copertă: Amintiri din copilărie, Ion Creangă").
   * Primitives do not know i18n keys, so the feature composes it.
   */
  accessibilityLabel: string;
}
