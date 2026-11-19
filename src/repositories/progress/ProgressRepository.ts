import type { BookId, Bookmark, Progress } from '@/shared/domain';

/**
 * Where listening resumes and the user's bookmarks, per book. Writes are immediate: the 3 s throttle
 * and the flush on pause / chapter change / background belong to the player (M5), not here.
 */
export interface ProgressRepository {
  /** `null` when the book was never played or the stored value is invalid. */
  getProgress(id: BookId): Promise<Progress | null>;
  saveProgress(id: BookId, progress: Progress): Promise<void>;
  /** `[]` when there are none or the stored list is invalid. */
  getBookmarks(id: BookId): Promise<Bookmark[]>;
  /** Replaces the whole list. */
  saveBookmarks(id: BookId, bookmarks: readonly Bookmark[]): Promise<void>;
}
