import { z } from 'zod';
import { pageNumberSchema } from './primitives';

/** Sentences of a chapter (or of one part of it); `sentencePages[i]` is the page of `sentences[i]`. */
export const chapterChunkSchema = z
  .object({
    sentences: z.array(z.string()),
    sentencePages: z.array(pageNumberSchema),
  })
  .refine(chunk => chunk.sentences.length === chunk.sentencePages.length, {
    message: 'sentences and sentencePages differ in length',
    path: ['sentencePages'],
  });

/** Stored at `ch:{n}` when the chapter is too large for one value; parts live at `ch:{n}:p:{k}`. */
export const chapterPartsManifestSchema = z.object({
  parts: z.number().int().min(2),
});

/** What `abk:book:{id}:ch:{n}` holds: the whole chunk, or the manifest of its parts. */
export const chapterEntrySchema = z.union([
  chapterChunkSchema,
  chapterPartsManifestSchema,
]);

export type ChapterChunk = z.infer<typeof chapterChunkSchema>;
export type ChapterPartsManifest = z.infer<typeof chapterPartsManifestSchema>;
export type ChapterEntry = z.infer<typeof chapterEntrySchema>;
