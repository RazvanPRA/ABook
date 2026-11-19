import { z } from 'zod';
import { logger } from '@/shared/utils';

/**
 * Parses and validates one stored value. Missing → `null`; unparsable or invalid → logged with its
 * key and `null`, never thrown: a corrupt value behaves like a missing one (storage rule 1).
 */
export const readJson = <S extends z.ZodType>(
  raw: string | null | undefined,
  schema: S,
  key: string,
): z.output<S> | null => {
  if (raw === null || raw === undefined) {
    return null;
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    logger.warn('Unreadable JSON in storage, treated as missing', { key });
    return null;
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    logger.warn('Invalid value in storage, treated as missing', {
      key,
      issues: z.prettifyError(parsed.error),
    });
    return null;
  }
  return parsed.data;
};
