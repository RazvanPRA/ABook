import type { BookLanguage, BookMeta } from '@/shared/domain';
import { formatBytes, type ByteUnits } from '@/shared/utils';

/** The translated words the metadata chips are made of. */
export interface BookMetaWords {
  readonly pages: (count: number) => string;
  readonly bytes: ByteUnits;
  readonly languages: Readonly<Record<BookLanguage, string>>;
  readonly offline: string;
}

/** The chips under the title: pages (once known), size, voice language, "Offline". */
export function formatBookMeta(
  book: Pick<BookMeta, 'pageCount' | 'fileSizeBytes' | 'language'>,
  words: BookMetaWords,
): string[] {
  return [
    ...(book.pageCount > 0 ? [words.pages(book.pageCount)] : []),
    formatBytes(book.fileSizeBytes, words.bytes),
    words.languages[book.language],
    words.offline,
  ];
}
