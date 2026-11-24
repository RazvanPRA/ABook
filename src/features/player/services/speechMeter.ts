/** Sentences the speed is measured over (PROMPT §6). */
export const METERED_SENTENCES = 20;
/** Before anything is measured: a usual system voice at 1×. */
export const DEFAULT_CHARS_PER_SECOND = 14;

export interface SpokenSentence {
  readonly characters: number;
  readonly milliseconds: number;
  readonly rate: number;
}

export interface SpeechMeter {
  record(sentence: SpokenSentence): void;
  /** Characters per second at the given rate. */
  speedAt(rate: number): number;
}

/**
 * Measures how fast the voice reads: the moving average of the last sentences, brought to 1×, so a
 * rate change scales the speed instead of forgetting it.
 */
export function createSpeechMeter(): SpeechMeter {
  let last: SpokenSentence[] = [];
  return {
    record(sentence) {
      if (sentence.milliseconds > 0 && sentence.characters > 0) {
        last = [...last, sentence].slice(-METERED_SENTENCES);
      }
    },
    speedAt(rate) {
      const characters = last.reduce((sum, own) => sum + own.characters, 0);
      const atNormalRate = last.reduce(
        (sum, own) => sum + own.milliseconds * own.rate,
        0,
      );
      const speed =
        atNormalRate === 0
          ? DEFAULT_CHARS_PER_SECOND
          : (characters * 1000) / atNormalRate;
      return speed * rate;
    },
  };
}
