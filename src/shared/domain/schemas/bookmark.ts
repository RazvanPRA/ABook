import { z } from 'zod';
import {
  chapterIndexSchema,
  isoDateSchema,
  pageNumberSchema,
  sentenceIndexSchema,
} from './primitives';

export const bookmarkSchema = z.object({
  id: z.string().min(1),
  chapter: chapterIndexSchema,
  sentence: sentenceIndexSchema,
  page: pageNumberSchema,
  excerpt: z.string(),
  createdAt: isoDateSchema,
});

/** `abk:book:{id}:bookmarks`. */
export const bookmarksSchema = z
  .array(bookmarkSchema)
  .refine(list => new Set(list.map(b => b.id)).size === list.length, {
    message: 'duplicate bookmark id',
  });

export type Bookmark = z.infer<typeof bookmarkSchema>;
