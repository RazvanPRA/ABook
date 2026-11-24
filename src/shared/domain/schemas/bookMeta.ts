import { z } from 'zod';
import { bookIdSchema, countSchema, isoDateSchema } from './primitives';

export const BOOK_STATUSES = ['processing', 'ready', 'failed'] as const;
/** Why a book is `failed`: the file itself can't be imported, or the app's copy is gone. */
export const BOOK_FAILURES = [
  'scanned',
  'password',
  'corrupt',
  'missing-file',
] as const;
export const BOOK_LANGUAGES = ['ro-RO', 'en-US'] as const;

export const bookStatusSchema = z.enum(BOOK_STATUSES);
export const bookFailureSchema = z.enum(BOOK_FAILURES);
export const bookLanguageSchema = z.enum(BOOK_LANGUAGES);

/** `abk:book:{id}:meta`. `pageCount` may be 0 while the PDF hasn't been opened yet. */
export const bookMetaSchema = z
  .object({
    id: bookIdSchema,
    title: z.string().min(1),
    author: z.string(),
    language: bookLanguageSchema,
    fileUri: z.string().min(1),
    fileSizeBytes: countSchema,
    pageCount: countSchema,
    chapterCount: countSchema,
    sentenceCount: countSchema,
    status: bookStatusSchema,
    processedPages: countSchema,
    importedAt: isoDateSchema,
    coverColor: z.string().min(1),
    /**
     * Size + SHA-256 of the first 64 KB (`pdfFingerprint`), for the duplicate check; `null` for
     * books imported before schema 2 (migration 002), which are never reported as duplicates.
     */
    fingerprint: z.string().min(1).nullable(),
    /**
     * Set with `failed`, cleared when the import continues; `null` for a book that isn't failed, or
     * that failed before schema 3 (migration 003), when the reason wasn't stored.
     */
    failure: bookFailureSchema.nullable(),
  })
  .refine(meta => meta.processedPages <= meta.pageCount, {
    message: 'processedPages exceeds pageCount',
    path: ['processedPages'],
  });

/** `abk:books`: library order. Duplicates would show a book twice, so they are rejected. */
export const bookOrderSchema = z
  .array(bookIdSchema)
  .refine(ids => new Set(ids).size === ids.length, {
    message: 'duplicate book id',
  });

export type BookStatus = z.infer<typeof bookStatusSchema>;
export type BookFailure = z.infer<typeof bookFailureSchema>;
export type BookLanguage = z.infer<typeof bookLanguageSchema>;
export type BookMeta = z.infer<typeof bookMetaSchema>;
