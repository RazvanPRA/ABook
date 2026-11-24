import type { BookMeta } from '@/shared/domain';
import type { ImportContext } from '../model/dependencies';
import { ImportCancelledError } from '../model/errors';
import { importResumed } from '../state/importSlice';
import { resumePoint } from './resumePoint';
import { continueBook } from './runImport';

/**
 * Continues a book a killed import left `processing` (its PDF is still there, the boot checked):
 * the saved toc and `processedPages` give the resume point, the meta gives the form. The book
 * then ends as if the import had never stopped.
 */
export async function resumeImport(
  context: ImportContext,
  meta: BookMeta,
): Promise<void> {
  const toc = await context.bookRepository.getToc(meta.id);
  if (context.isDiscarded(meta.id)) {
    throw new ImportCancelledError(); // deleted during the read, before the slice knew the book
  }
  const resume = resumePoint(meta, toc);
  context.dispatch(
    importResumed({
      bookId: meta.id,
      file: {
        name: meta.title,
        uri: meta.fileUri,
        sizeBytes: meta.fileSizeBytes,
      },
      form: {
        title: meta.title,
        author: meta.author,
        language: meta.language,
      },
      chaptersSaved: resume.toc.length,
      metadataRead: meta.pageCount > 0,
    }),
  );
  await continueBook(context, {
    bookId: meta.id,
    path: meta.fileUri,
    resume,
  });
}
