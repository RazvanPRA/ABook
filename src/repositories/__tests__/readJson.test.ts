import { DEFAULT_SETTINGS, settingsSchema } from '@/shared/domain';
import { readJson } from '../readJson';
import { MAX_VALUE_BYTES } from '../limits';
import { serialize } from '../serialize';

const KEY = 'abk:settings';

describe('readJson', () => {
  let warn: jest.SpyInstance;
  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it('returns the parsed, validated value', () => {
    const raw = JSON.stringify(DEFAULT_SETTINGS);
    expect(readJson(raw, settingsSchema, KEY)).toEqual(DEFAULT_SETTINGS);
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([[null], [undefined]])(
    'returns null for a missing value (%p), silently',
    raw => {
      expect(readJson(raw, settingsSchema, KEY)).toBeNull();
      expect(warn).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['unparsable JSON', '{"voiceId":'],
    ['an empty string', ''],
    ['a valid JSON of the wrong shape', '{"voiceId":42}'],
    ['a JSON scalar', '7'],
  ])('returns null and logs the key for %s', (_case, raw) => {
    expect(readJson(raw, settingsSchema, KEY)).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('treated as missing'),
      expect.objectContaining({ key: KEY }),
    );
  });
});

describe('serialize', () => {
  it('returns the JSON of a value under the limit', () => {
    expect(serialize(KEY, { a: 'ș' })).toBe('{"a":"ș"}');
  });

  it('refuses a value over the limit, counting UTF-8 bytes', () => {
    // Fits in characters, not in bytes: each "ă" is 2 bytes
    const value = 'ă'.repeat(MAX_VALUE_BYTES / 2);
    expect(value.length).toBeLessThan(MAX_VALUE_BYTES);
    expect(() => serialize(KEY, value)).toThrow(new RegExp(KEY));
  });
});
