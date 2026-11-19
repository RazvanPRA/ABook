import type { Settings } from '@/shared/domain';

/** The app settings. Writes are immediate; the 500 ms debounce belongs to the settings screen (M6). */
export interface SettingsRepository {
  /** Never fails: missing → defaults; partly invalid → the valid fields over the defaults. */
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
}
