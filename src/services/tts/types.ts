/** A voice installed on the device that speaks without a connection. */
export interface Voice {
  readonly id: string;
  readonly name: string;
  /** BCP 47: `ro-RO`. */
  readonly language: string;
  /** The platform's own scale, higher is better. */
  readonly quality: number;
}

/**
 * `engine`: there is no speech engine, or it stopped answering. `language`: it can't speak the
 * book's language. `synthesis`: this sentence failed.
 */
export const TTS_ERROR_CODES = ['engine', 'language', 'synthesis'] as const;
export type TtsErrorCode = (typeof TTS_ERROR_CODES)[number];

export class TtsError extends Error {
  constructor(readonly code: TtsErrorCode) {
    super(`Speech failed: ${code}`);
    this.name = 'TtsError';
  }
}

export interface SpeakOptions {
  /** `null`: the platform's default voice of `language`. */
  readonly voiceId: string | null;
  readonly language: string;
  readonly rate: number;
  readonly pitch: number;
  onStart(): void;
  onDone(): void;
  onError(error: TtsError): void;
}

/**
 * The system voice, one utterance at a time. `speak` replaces what is being spoken, and the
 * callbacks of a replaced or stopped utterance are never called.
 */
export interface TtsEngine {
  /** Every offline voice, best first. Rejects with a `TtsError` when there is no engine. */
  listVoices(): Promise<Voice[]>;
  speak(text: string, options: SpeakOptions): void;
  stop(): Promise<void>;
  isSpeaking(): Promise<boolean>;
  /** The voice was, or would be, interrupted: a call, another player, headphones unplugged. */
  onInterruption(listener: () => void): () => void;
  /** The system's voice settings; rejects where there are none. */
  openSettings(): Promise<void>;
}
