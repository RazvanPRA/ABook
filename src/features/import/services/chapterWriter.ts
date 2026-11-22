import { toChapter } from '@/services/text';
import { bookUpserted } from '@/features/library';
import { toChapterIndex, type BookId, type Chapter } from '@/shared/domain';
import type { ImportContext } from '../model/dependencies';
import { chapterSaved } from '../state/importSlice';
import { throwIfCancelled } from './cancellation';
import type { ChapterDraft } from './chapterAssembler';
import { chapterText } from './chapterText';

export interface ChapterWriter {
  /** Cleans, segments and saves a completed chapter, then the toc, then `processedPages`. */
  write(draft: ChapterDraft): Promise<void>;
  /** The table of contents so far: one entry per saved chapter. */
  toc(): readonly Chapter[];
}

export interface WriterOptions {
  readonly bookId: BookId;
  readonly bookHeaders: ReadonlySet<string>;
  /** Chapters saved before a resume; new chapters continue their indexes. */
  readonly saved: readonly Chapter[];
}

/**
 * Saves chapters as they complete, so the book is playable from its first chapter. The toc is
 * saved with every chapter, so a resumed import knows the saved chapters without reading their
 * pages again. A chapter with no text (blank or image-only pages) is skipped, keeping chapter
 * indexes contiguous, but its pages still count as processed.
 */
export function createChapterWriter(
  context: ImportContext,
  { bookId, bookHeaders, saved }: WriterOptions,
): ChapterWriter {
  const { bookRepository, dispatch } = context;
  const toc: Chapter[] = [...saved];
  const save = async (draft: ChapterDraft) => {
    const chunk = chapterText(draft, bookHeaders);
    if (chunk.sentences.length === 0) {
      return;
    }
    const index = toc.length;
    await bookRepository.saveChapter(bookId, toChapterIndex(index), chunk);
    toc.push(toChapter(index, draft, chunk));
    dispatch(chapterSaved());
  };
  return {
    write: async draft => {
      throwIfCancelled(context);
      await save(draft);
      await bookRepository.saveToc(bookId, toc);
      const meta = await bookRepository.updateMeta(bookId, {
        processedPages: draft.endPage,
      });
      if (meta) {
        dispatch(bookUpserted(meta));
      }
      await context.yieldToJs();
    },
    toc: () => toc,
  };
}
