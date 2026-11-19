import {
  DEFAULT_SETTINGS,
  settingsSchema,
  type Settings,
} from '@/shared/domain';
import { logger } from '@/shared/utils';

const FIELDS = Object.keys(settingsSchema.shape) as (keyof Settings)[];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

/** Each field validated on its own: a bad voice id must not reset the speed the user picked. */
const mergeValidFields = (stored: Record<string, unknown>): Settings => {
  const merged: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  const rejected = FIELDS.filter(field => {
    const parsed = settingsSchema.shape[field].safeParse(stored[field]);
    if (parsed.success) {
      merged[field] = parsed.data;
    }
    return !parsed.success;
  });
  logger.warn('Invalid settings fields replaced by defaults', { rejected });
  return settingsSchema.parse(merged);
};

/**
 * `abk:settings` as `Settings`, never failing: missing → defaults; unreadable or not an object →
 * defaults (logged); partly invalid → the valid fields over the defaults (logged). Unknown fields
 * (e.g. from a newer app) are dropped.
 */
export const settingsFromStored = (
  raw: string | null | undefined,
): Settings => {
  if (raw === null || raw === undefined) {
    return { ...DEFAULT_SETTINGS };
  }
  const json = parseJson(raw);
  if (!isRecord(json)) {
    logger.warn('Unreadable settings, defaults used', { raw });
    return { ...DEFAULT_SETTINGS };
  }
  const parsed = settingsSchema.safeParse(json);
  return parsed.success ? parsed.data : mergeValidFields(json);
};
