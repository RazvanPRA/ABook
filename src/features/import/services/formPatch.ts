import type { BookMetaPatch } from '@/repositories';
import type { ImportForm } from '../model/types';

/**
 * The form's fields as a meta patch, trimmed. An empty title is left out: the meta keeps the one
 * it has (from the file name), since a book must have a title.
 */
export function formPatch({
  title,
  author,
  language,
}: ImportForm): BookMetaPatch {
  const trimmed = title.trim();
  return {
    ...(trimmed === '' ? {} : { title: trimmed }),
    author: author.trim(),
    language,
  };
}
