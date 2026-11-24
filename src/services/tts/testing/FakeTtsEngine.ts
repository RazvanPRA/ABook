import {
  TtsError,
  type SpeakOptions,
  type TtsEngine,
  type TtsErrorCode,
  type Voice,
} from '../types';

export const RO_VOICE: Voice = {
  id: 'ro-1',
  name: 'ro-1',
  language: 'ro-RO',
  quality: 400,
};
export const EN_VOICE: Voice = {
  id: 'en-1',
  name: 'en-1',
  language: 'en-US',
  quality: 400,
};

export interface FakeUtterance {
  readonly text: string;
  readonly options: SpeakOptions;
}

/**
 * A `TtsEngine` for tests. Utterances end only on demand: `complete()` and `fail()` act on the
 * current one. `lateDone(n)` calls the n-th utterance's `onDone` even after it was replaced, as a
 * badly timed engine would.
 */
export class FakeTtsEngine implements TtsEngine {
  voices: Voice[] = [RO_VOICE, EN_VOICE];
  /** Without an engine, listing the voices rejects. */
  available = true;
  readonly utterances: FakeUtterance[] = [];
  stops = 0;
  settingsOpened = 0;
  private listeners: (() => void)[] = [];
  private current: FakeUtterance | null = null;

  get spoken(): string[] {
    return this.utterances.map(({ text }) => text);
  }

  get last(): FakeUtterance | undefined {
    return this.utterances[this.utterances.length - 1];
  }

  /** What is being spoken, `null` while silent. */
  get speaking(): string | null {
    return this.current?.text ?? null;
  }

  async listVoices(): Promise<Voice[]> {
    if (!this.available) {
      throw new TtsError('engine');
    }
    return [...this.voices];
  }

  speak(text: string, options: SpeakOptions): void {
    this.current = { text, options };
    this.utterances.push(this.current);
  }

  async stop(): Promise<void> {
    this.stops += 1;
    this.current = null;
  }

  async isSpeaking(): Promise<boolean> {
    return this.current !== null;
  }

  onInterruption(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(known => known !== listener);
    };
  }

  interrupt(): void {
    this.listeners.forEach(listener => listener());
  }

  async openSettings(): Promise<void> {
    this.settingsOpened += 1;
  }

  start(): void {
    this.current?.options.onStart();
  }

  complete(): void {
    const done = this.current;
    this.current = null;
    done?.options.onStart();
    done?.options.onDone();
  }

  fail(code: TtsErrorCode = 'synthesis'): void {
    const failed = this.current;
    this.current = null;
    failed?.options.onError(new TtsError(code));
  }

  lateDone(index: number): void {
    this.utterances[index]?.options.onDone();
  }
}
