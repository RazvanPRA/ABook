import type { Chapter } from '@/shared/domain';

/** The chapter's own title, or the name an untitled one gets from its 1-based number. */
export function chapterTitle(
  { index, title }: Pick<Chapter, 'index' | 'title'>,
  untitled: (number: number) => string,
): string {
  const text = title.trim();
  return text === '' ? untitled(index + 1) : text;
}
