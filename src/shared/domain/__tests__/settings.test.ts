import {
  DEFAULT_SETTINGS,
  PITCH_RANGE,
  RATE_RANGE,
  settingsSchema,
} from '../schemas';

describe('settingsSchema', () => {
  it('accepts the defaults', () => {
    expect(settingsSchema.parse(DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps the defaults immutable', () => {
    expect(Object.isFrozen(DEFAULT_SETTINGS)).toBe(true);
  });

  it.each([
    ['a chosen voice', { voiceId: 'ro-ro-x-vfv-local' }],
    ['the slowest rate', { defaultRate: RATE_RANGE.min }],
    ['the fastest rate', { defaultRate: RATE_RANGE.max }],
    ['the pitch bounds', { pitch: PITCH_RANGE.min }],
    ['the largest text', { fontScale: 2 }],
  ])('accepts %s', (_case, overrides) => {
    expect(
      settingsSchema.safeParse({ ...DEFAULT_SETTINGS, ...overrides }).success,
    ).toBe(true);
  });

  it.each([
    ['an empty voice id', { voiceId: '' }],
    ['a rate below the range', { defaultRate: 0.5 }],
    ['a rate above the range', { defaultRate: 2.5 }],
    ['a pitch above the range', { pitch: 3 }],
    ['an unknown font scale', { fontScale: 3 }],
    ['a non-boolean toggle', { highlightSentence: 'yes' }],
  ])('rejects %s', (_case, overrides) => {
    expect(
      settingsSchema.safeParse({ ...DEFAULT_SETTINGS, ...overrides }).success,
    ).toBe(false);
  });
});
