import {
  loadBookContent,
  selectBookById,
  selectBookProgress,
  selectImportingBookId,
} from '@/features/book';
import {
  READING_LANGUAGE,
  toChapterIndex,
  toSentenceIndex,
  type BookId,
  type BookMeta,
  type PlaybackRequest,
  type Progress,
} from '@/shared/domain';
import { logger } from '@/shared/utils';
import type { PlayerAppState, PlayerStoreApi } from '../model/dependencies';
import type { Position, Toc } from '../model/types';
import type { BookCompleteness, SessionBook } from '../services/session';
import { openingChanged } from './playerSlice';
import { getRuntime } from './runtime';

function completenessOf(
  state: PlayerAppState,
  book: BookMeta,
): BookCompleteness {
  if (book.status === 'ready') {
    return 'complete';
  }
  return selectImportingBookId(state) === book.id ? 'importing' : 'incomplete';
}

/** The saved chapters; an unreadable list is an empty one, which the session reports. */
async function readToc({ extra }: PlayerStoreApi, id: BookId): Promise<Toc> {
  try {
    return (await extra.bookRepository.getToc(id)) ?? [];
  } catch (error) {
    logger.warn('player: reading the chapters failed', error);
    return [];
  }
}

function sessionBook(
  state: PlayerAppState,
  book: BookMeta,
  toc: Toc,
): SessionBook {
  return {
    id: book.id,
    language: READING_LANGUAGE,
    completeness: completenessOf(state, book),
    toc,
  };
}

async function readProgress(
  { getState, extra }: PlayerStoreApi,
  id: BookId,
): Promise<Progress | null> {
  const known = selectBookProgress(getState(), id);
  if (known !== null || getState().libraryProgress.loaded) {
    return known;
  }
  try {
    return await extra.progressRepository.getProgress(id);
  } catch (error) {
    logger.warn('player: reading the progress failed', error);
    return null;
  }
}

/** Where a request starts: where it says, or where listening stopped in a book not finished. */
function startOf(
  { chapter, sentence }: Omit<PlaybackRequest, 'bookId'>,
  progress: Progress | null,
): Position | null {
  if (chapter !== undefined) {
    return { chapter, sentence: sentence ?? toSentenceIndex(0) };
  }
  return progress === null || progress.finished
    ? null
    : {
        chapter: toChapterIndex(progress.chapter),
        sentence: toSentenceIndex(progress.sentence),
      };
}

/**
 * Reads the book's chapters and opens it, playing or not. The book already open only goes on,
 * unless a place in it is asked for.
 */
export async function openBook(
  api: PlayerStoreApi,
  { bookId, ...from }: PlaybackRequest,
  play: boolean,
): Promise<void> {
  const runtime = getRuntime(api);
  const { session, writer } = runtime;
  if (
    selectBookById(api.getState(), bookId) === null ||
    writer.isRefused(bookId)
  ) {
    return;
  }
  runtime.request += 1;
  const { request } = runtime;
  const { status, bookId: current } = session.snapshot();
  const resumes = from.chapter === undefined && current === bookId;
  if (resumes && status !== 'ended') {
    api.dispatch(openingChanged(null));
    if (play) {
      session.play();
    }
    return;
  }
  api.dispatch(openingChanged(bookId));
  // The content is for the screen; the session has its own read, which a newer one can't replace
  const [toc, progress] = await Promise.all([
    readToc(api, bookId),
    readProgress(api, bookId),
    api.dispatch(loadBookContent(bookId)),
  ]);
  const book = selectBookById(api.getState(), bookId);
  if (request !== runtime.request) {
    return;
  }
  if (book !== null && !writer.isRefused(bookId)) {
    const at = startOf(from, progress);
    session.open(sessionBook(api.getState(), book, toc), { at, play });
  }
  api.dispatch(openingChanged(null));
}

/** The import of the open book saved a chapter, ended or stopped. */
export async function refreshBook(
  api: PlayerStoreApi,
  bookId: BookId,
): Promise<void> {
  const { session } = getRuntime(api);
  if (session.snapshot().bookId !== bookId) {
    return;
  }
  const [toc] = await Promise.all([
    readToc(api, bookId),
    api.dispatch(loadBookContent(bookId)),
  ]);
  const book = selectBookById(api.getState(), bookId);
  if (book !== null) {
    session.updateBook(sessionBook(api.getState(), book, toc));
  }
}
