import { z } from 'zod';
import {
  toBookId,
  toChapterIndex,
  toPageNumber,
  toSentenceIndex,
} from '../ids';

/** Building blocks shared by the persisted schemas; each one produces the branded domain type. */
export const bookIdSchema = z.uuid().transform(toBookId);
export const pageNumberSchema = z.number().int().min(1).transform(toPageNumber);
export const chapterIndexSchema = z
  .number()
  .int()
  .nonnegative()
  .transform(toChapterIndex);
export const sentenceIndexSchema = z
  .number()
  .int()
  .nonnegative()
  .transform(toSentenceIndex);
export const countSchema = z.number().int().nonnegative();
/** ISO 8601 UTC timestamp, as produced by `Date.prototype.toISOString`. */
export const isoDateSchema = z.iso.datetime();
