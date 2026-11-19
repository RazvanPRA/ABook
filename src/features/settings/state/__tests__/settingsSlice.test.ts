import { DEFAULT_SETTINGS } from '@/shared/domain';
import { selectSettings } from '../selectors';
import { settingsHydrated, settingsReducer } from '../settingsSlice';

describe('settingsSlice', () => {
  it('starts with a mutable copy of the defaults', () => {
    const state = settingsReducer(undefined, { type: '@@init' });
    expect(state).toEqual(DEFAULT_SETTINGS);
    expect(state).not.toBe(DEFAULT_SETTINGS);
  });

  it('replaces the settings on hydration', () => {
    const stored = {
      ...DEFAULT_SETTINGS,
      voiceId: 'ro-voice',
      defaultRate: 1.5,
    };
    const state = settingsReducer(undefined, settingsHydrated(stored));
    expect(selectSettings({ settings: state })).toEqual(stored);
  });
});
