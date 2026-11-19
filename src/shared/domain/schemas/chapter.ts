import { z } from 'zod';
import {
  chapterIndexSchema,
  countSchema,
  pageNumberSchema,
} from './primitives';

export const chapterSchema = z
  .object({
    index: chapterIndexSchema,
    title: z.string(),
    startPage: pageNumberSchema,
    endPage: pageNumberSchema,
    sentenceCount: countSchema,
  })
  .refine(chapter => chapter.startPage <= chapter.endPage, {
    message: 'startPage is after endPage',
    path: ['endPage'],
  });

/** `abk:book:{id}:toc`: chapter `index` must equal its position, so `ch:{n}` keys line up. */
export const tocSchema = z
  .array(chapterSchema)
  .refine(chapters => chapters.every((chapter, i) => chapter.index === i), {
    message: 'chapter indexes are not 0..n-1 in order',
  });

export type Chapter = z.infer<typeof chapterSchema>;
