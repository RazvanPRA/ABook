import { createAction } from '@reduxjs/toolkit';
import type { BookId, ChapterIndex, SentenceIndex } from './ids';

export interface PlaybackRequest {
  readonly bookId: BookId;
  /** Where to start; without them, where listening stopped. */
  readonly chapter?: ChapterIndex;
  readonly sentence?: SentenceIndex;
}

/**
 * The user wants to listen to a book, from the library or its details. The player (M5) handles it;
 * the features that dispatch it don't know the player.
 */
export const playbackRequested =
  createAction<PlaybackRequest>('playback/requested');
