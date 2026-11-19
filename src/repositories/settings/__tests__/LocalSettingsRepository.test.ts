import { DEFAULT_SETTINGS, type Settings } from '@/shared/domain';
import { InMemoryKeyValueStore } from '@/storage/testing';
import { createLocalSettingsRepository, settingsFromStored } from '..';

const CUSTOM: Settings = {
  ...DEFAULT_SETTINGS,
  voiceId: 'ro-ro-x-vfv-local',
  defaultRate: 1.25,
  fontScale: 2,
};

describe('LocalSettingsRepository', () => {
  it('returns the defaults when nothing is stored, then what was saved', async () => {
    const kv = new InMemoryKeyValueStore();
    const repo = createLocalSettingsRepository({ kv });
    expect(await repo.getSettings()).toEqual(DEFAULT_SETTINGS);
    await repo.saveSettings(CUSTOM);
    expect(await repo.getSettings()).toEqual(CUSTOM);
  });

  it('returns a copy of the defaults, never the frozen object', async () => {
    const repo = createLocalSettingsRepository({
      kv: new InMemoryKeyValueStore(),
    });
    const settings = await repo.getSettings();
    expect(settings).not.toBe(DEFAULT_SETTINGS);
    expect(Object.isFrozen(settings)).toBe(false);
  });

  it('refuses invalid settings without writing', async () => {
    const kv = new InMemoryKeyValueStore();
    const repo = createLocalSettingsRepository({ kv });
    await expect(repo.saveSettings({ ...CUSTOM, pitch: 9 })).rejects.toThrow();
    expect(kv.snapshot()).toEqual({});
  });
});

describe('settingsFromStored', () => {
  let warn: jest.SpyInstance;
  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it.each([[null], [undefined]])('gives the defaults for %p, silently', raw => {
    expect(settingsFromStored(raw)).toEqual(DEFAULT_SETTINGS);
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([
    ['unparsable JSON', '{"voiceId":'],
    ['an array', '[1,2]'],
    ['a scalar', '1.25'],
    ['JSON null', 'null'],
  ])('gives the defaults for %s, and logs it', (_case, raw) => {
    expect(settingsFromStored(raw)).toEqual(DEFAULT_SETTINGS);
    expect(warn).toHaveBeenCalled();
  });

  it('keeps the valid fields of a partly invalid value', () => {
    const stored = { ...CUSTOM, voiceId: 42, pitch: 'high' };
    expect(settingsFromStored(JSON.stringify(stored))).toEqual({
      ...CUSTOM,
      voiceId: DEFAULT_SETTINGS.voiceId,
      pitch: DEFAULT_SETTINGS.pitch,
    });
    expect(warn).toHaveBeenCalledWith(expect.any(String), {
      rejected: ['voiceId', 'pitch'],
    });
  });

  it('fills fields missing from an older value and drops unknown ones', () => {
    const older: Partial<Settings> = { ...CUSTOM };
    delete older.fontScale;
    const stored = { ...older, futureOption: true };
    expect(settingsFromStored(JSON.stringify(stored))).toEqual({
      ...CUSTOM,
      fontScale: DEFAULT_SETTINGS.fontScale,
    });
  });

  it('accepts a complete value as is, silently', () => {
    expect(settingsFromStored(JSON.stringify(CUSTOM))).toEqual(CUSTOM);
    expect(warn).not.toHaveBeenCalled();
  });
});
