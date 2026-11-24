import { pickVoice } from '../pickVoice';
import { EN_VOICE, RO_VOICE } from '../testing';

const MD = { ...RO_VOICE, id: 'ro-md', language: 'ro-MD' };
const GB = { ...EN_VOICE, id: 'en-gb', language: 'en-GB' };
const ALL = [MD, RO_VOICE, GB, EN_VOICE];

describe('pickVoice', () => {
  it.each([
    ['the saved one of the language', ALL, 'ro-md', 'ro-RO', 'ro-md', false],
    ['the region first, nothing saved', ALL, null, 'ro-RO', 'ro-1', false],
    ['a saved one of another language', ALL, 'en-1', 'ro-RO', 'ro-1', false],
    ['a saved one no longer there', ALL, 'gone', 'en-US', 'en-1', true],
    ['another region when it is all', [GB], null, 'en-US', 'en-gb', false],
    ['none of the language', [EN_VOICE], null, 'ro-RO', undefined, false],
    ['none at all, one saved', [], 'gone', 'ro-RO', undefined, true],
  ])('%s', (_name, voices, savedId, language, id, replaced) => {
    const picked = pickVoice(voices, { savedId, language });
    expect(picked.voice?.id).toBe(id);
    expect(picked.replaced).toBe(replaced);
  });
});
