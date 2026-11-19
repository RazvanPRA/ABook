import { settingsSchema } from '@/shared/domain';
import { rootKey, type KeyValueStore } from '@/storage';
import { serialize } from '../serialize';
import type { SettingsRepository } from './SettingsRepository';
import { settingsFromStored } from './settingsFromStored';

const SETTINGS_KEY = rootKey('settings');

/** `SettingsRepository` over `abk:settings`. */
export const createLocalSettingsRepository = ({
  kv,
}: {
  kv: KeyValueStore;
}): SettingsRepository => ({
  async getSettings() {
    return settingsFromStored((await kv.getMany([SETTINGS_KEY]))[SETTINGS_KEY]);
  },

  async saveSettings(settings) {
    await kv.setMany({
      [SETTINGS_KEY]: serialize(SETTINGS_KEY, settingsSchema.parse(settings)),
    });
  },
});
