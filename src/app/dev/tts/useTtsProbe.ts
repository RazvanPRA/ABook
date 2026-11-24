import { useCallback, useEffect, useState } from 'react';
import type { Voice } from '@/services/tts';
import { useAppServices } from '../../providers/ServicesProvider';

export const TTS_SAMPLES = {
  'ro-RO': 'Ana are mere, iar Ștefan își ține cățelul în brațe.',
  'en-US': 'The quick brown fox jumps over the lazy dog.',
} as const;

export type SampleLanguage = keyof typeof TTS_SAMPLES;

/** The voices and what happened to the last sentence, for abook://dev/tts. */
export function useTtsProbe() {
  const { ttsEngine } = useAppServices();
  const [voices, setVoices] = useState<readonly Voice[]>([]);
  const [log, setLog] = useState<readonly string[]>([]);
  const note = useCallback(
    (line: string) => setLog(lines => [line, ...lines].slice(0, 12)),
    [],
  );
  useEffect(() => {
    ttsEngine
      .listVoices()
      .then(setVoices)
      .catch(error => note(`voci: ${String(error)}`));
  }, [ttsEngine, note]);

  const speak = useCallback(
    (language: SampleLanguage, rate = 1) =>
      ttsEngine.speak(TTS_SAMPLES[language], {
        voiceId: null,
        language,
        rate,
        pitch: 1,
        onStart: () => note(`${language}: start`),
        onDone: () => note(`${language}: done`),
        onError: error => note(`${language}: ${error.code}`),
      }),
    [ttsEngine, note],
  );
  const stop = useCallback(() => {
    ttsEngine.stop().then(() => note('stop'));
  }, [ttsEngine, note]);
  const openSettings = useCallback(() => {
    ttsEngine.openSettings().catch(error => note(String(error)));
  }, [ttsEngine, note]);
  return { voices, log, speak, stop, openSettings };
}
