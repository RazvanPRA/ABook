import {
  DEFAULT_SETTINGS,
  type BookMeta,
  type Settings,
} from '@/shared/domain';
import { logger } from '@/shared/utils';
import type { BootRepository } from '@/repositories';

/** What the store is hydrated with before the first screen. */
export interface BootResult {
  books: BookMeta[];
  settings: Settings;
}

const EMPTY_BOOT = (): BootResult => ({
  books: [],
  settings: { ...DEFAULT_SETTINGS },
});

/** Runs one stage; a failure is logged and replaced by `fallback`, so the app still starts. */
const attempt = async <T, F>(
  stage: string,
  run: () => Promise<T>,
  fallback: F,
): Promise<T | F> => {
  try {
    return await run();
  } catch (error) {
    logger.warn(`Bootstrap stage failed: ${stage}`, error);
    return fallback;
  }
};

/**
 * Migrations → boot snapshot (one read) → repair of an unreadable library order → interrupted
 * imports marked `failed` → orphan sweep. Never rejects: if storage can't be read at all, the app
 * starts with an empty library and the default settings.
 */
export const bootstrap = async (boot: BootRepository): Promise<BootResult> => {
  await attempt('migrations', () => boot.migrate(), null);
  const snapshot = await attempt('snapshot', () => boot.loadSnapshot(), null);
  if (snapshot === null) {
    return EMPTY_BOOT();
  }
  await attempt('order repair', () => boot.repairOrder(snapshot), null);
  const books = await attempt(
    'interrupted imports',
    () => boot.failInterruptedImports(snapshot.books),
    snapshot.books,
  );
  await attempt('orphan sweep', () => boot.sweepOrphans(snapshot), null);
  return { books, settings: snapshot.settings };
};
