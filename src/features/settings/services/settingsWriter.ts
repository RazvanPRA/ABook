import type { SettingsRepository } from '@/repositories';
import type { Settings } from '@/shared/domain';
import { logger } from '@/shared/utils';

/** Changes closer than this are written together (a slider being dragged). */
export const SAVE_DELAY_MS = 500;

export interface SettingsWriter {
  schedule(settings: Settings): void;
  /** Writes what waits now. Never rejects. */
  flush(): Promise<void>;
}

/** Writes the last settings once they stop changing. JS timers stop in background: flush there. */
export function createSettingsWriter(
  repository: Pick<SettingsRepository, 'saveSettings'>,
): SettingsWriter {
  let waiting: Settings | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flush = async () => {
    clearTimeout(timer);
    const settings = waiting;
    waiting = null;
    if (settings === null) {
      return;
    }
    try {
      await repository.saveSettings(settings);
    } catch (error) {
      logger.warn('settings: saving failed', error);
    }
  };

  return {
    schedule(settings) {
      waiting = settings;
      clearTimeout(timer);
      timer = setTimeout(flush, SAVE_DELAY_MS);
    },
    flush,
  };
}
