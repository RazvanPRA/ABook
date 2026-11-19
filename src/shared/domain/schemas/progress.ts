import { z } from 'zod';
import {
  chapterIndexSchema,
  isoDateSchema,
  pageNumberSchema,
  sentenceIndexSchema,
} from './primitives';

/** `abk:book:{id}:progress`: the sentence where listening resumes. */
export const progressSchema = z.object({
  chapter: chapterIndexSchema,
  sentence: sentenceIndexSchema,
  page: pageNumberSchema,
  finished: z.boolean(),
  updatedAt: isoDateSchema,
});

export type Progress = z.infer<typeof progressSchema>;
