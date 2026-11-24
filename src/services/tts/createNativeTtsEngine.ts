import type { TurboModule } from 'react-native';
import NativeAbookTts, {
  type NativeVoice,
  type Spec,
  type UtteranceEvent,
} from '../../../specs/NativeAbookTts';
import {
  TTS_ERROR_CODES,
  TtsError,
  type SpeakOptions,
  type TtsEngine,
  type TtsErrorCode,
  type Voice,
} from './types';

const toErrorCode = (code: string): TtsErrorCode =>
  TTS_ERROR_CODES.find(known => known === code) ?? 'synthesis';

const isUsable = (voice: NativeVoice) => voice.installed && !voice.network;

const byQuality = (a: Voice, b: Voice) =>
  b.quality - a.quality || a.id.localeCompare(b.id);

const toVoice = ({ id, name, language, quality }: NativeVoice): Voice => ({
  id,
  name,
  language,
  quality,
});

interface Utterance {
  readonly id: string;
  readonly options: SpeakOptions;
}

/** Hands an event to the utterance it belongs to. */
function deliver({ options }: Utterance, { type, code }: UtteranceEvent): void {
  if (type === 'start') {
    options.onStart();
  } else if (type === 'done') {
    options.onDone();
  } else if (type === 'error') {
    options.onError(new TtsError(toErrorCode(code)));
  }
}

type NativeTts = Omit<Spec, keyof TurboModule>;

/** The current utterance; late native events, matched by id, are dropped. */
function trackUtterance(native: Pick<NativeTts, 'onUtterance'>) {
  let current: Utterance | null = null;
  let spoken = 0;
  native.onUtterance(event => {
    const utterance = current;
    if (utterance?.id !== event.id) {
      return;
    }
    // Cleared first: the callback may already speak the next sentence
    if (event.type !== 'start') {
      current = null;
    }
    deliver(utterance, event);
  });
  return {
    begin: (options: SpeakOptions): string => {
      spoken += 1;
      const id = `u${spoken}`;
      current = { id, options };
      return id;
    },
    drop: () => {
      current = null;
    },
  };
}

async function usableVoices(native: Pick<NativeTts, 'getVoices'>) {
  try {
    const voices = await native.getVoices();
    return voices.filter(isUsable).map(toVoice).sort(byQuality);
  } catch {
    throw new TtsError('engine');
  }
}

/** `TtsEngine` over the `AbookTts` TurboModule. */
export function createNativeTtsEngine(
  native: NativeTts = NativeAbookTts,
): TtsEngine {
  const utterance = trackUtterance(native);
  return {
    listVoices: () => usableVoices(native),
    speak(text, options) {
      const id = utterance.begin(options);
      const { voiceId, language, rate, pitch } = options;
      native.speak({ id, text, voiceId, language, rate, pitch });
    },
    async stop() {
      utterance.drop();
      await native.stop();
    },
    isSpeaking: () => native.isSpeaking(),
    openSettings: () => native.openSettings(),
  };
}
