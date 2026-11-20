import { toChapter } from '@/services/text';
import { bookUpserted } from '@/features/library';
import { toChapterIndex, type BookId, type Chapter } from '@/shared/domain';
import type { ImportContext } from '../model/dependencies';
import { chapterSaved } from '../state/importSlice';
import { throwIfCancelled } from './cancellation';
import type { ChapterDraft } from './chapterAssembler';
import { chapterText } from './chapterText';

export interface ChapterWriter {
  /** Cleans, segments and saves a completed chapter, then records `processedPages`. */
  write(draft: ChapterDraft): Promise<void>;
  /** The table of contents so far: one entry per saved chapter. */
  toc(): readonly Chapter[];
}

/**
 * Saves chapters as they complete, so the book is playable from its first chapter. A chapter with
 * no text (blank or image-only pages) is skipped, keeping chapter indexes contiguous, but its pages
 * still count as processed.
 */
export function createChapterWriter(
  context: ImportContext,
  bookId: BookId,
  bookHeaders: ReadonlySet<string>,
): ChapterWriter {
  const { bookRepository, dispatch } = context;
  const toc: Chapter[] = [];
  return {
    write: async draft => {
      throwIfCancelled(context);
      const chunk = chapterText(draft, bookHeaders);
      if (chunk.sentences.length > 0) {
        const range = {
          title: draft.title,
          startPage: draft.startPage,
          endPage: draft.endPage,
        };
        const index = toc.length;
        await bookRepository.saveChapter(bookId, toChapterIndex(index), chunk);
        toc.push(toChapter(index, range, chunk));
        dispatch(chapterSaved());
      }
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
