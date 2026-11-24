import type { BookMeta } from '@/shared/domain';
import { formatBytes, type ByteUnits } from '@/shared/utils';

/** The translated words the metadata chips are made of. */
export interface BookMetaWords {
  readonly pages: (count: number) => string;
  readonly bytes: ByteUnits;
  /** Of the voice: the same for every book. */
  readonly language: string;
  readonly offline: string;
}

/** The chips under the title: pages (once known), size, voice language, "Offline". */
export function formatBookMeta(
  book: Pick<BookMeta, 'pageCount' | 'fileSizeBytes'>,
  words: BookMetaWords,
): string[] {
  return [
    ...(book.pageCount > 0 ? [words.pages(book.pageCount)] : []),
    formatBytes(book.fileSizeBytes, words.bytes),
    words.language,
    words.offline,
  ];
}
