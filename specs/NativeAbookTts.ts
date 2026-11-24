import {
  TurboModuleRegistry,
  type CodegenTypes,
  type TurboModule,
} from 'react-native';

export interface NativeVoice {
  id: string;
  name: string;
  /** BCP 47, two-letter language: `ro-RO`. */
  language: string;
  /** The engine's own scale, higher is better; only good for sorting. */
  quality: number;
  /** Speaks only with a connection. */
  network: boolean;
  installed: boolean;
}

export interface SpeakRequest {
  id: string;
  text: string;
  voiceId: string | null;
  /** BCP 47; used when `voiceId` is null. */
  language: string;
  rate: number;
  pitch: number;
}

export interface UtteranceEvent {
  id: string;
  /** `start` | `done` | `error`. */
  type: string;
  /** Only for `error`: `engine` | `language` | `synthesis`; empty otherwise. */
  code: string;
}

export interface PlaybackNotice {
  title: string;
  text: string;
  playing: boolean;
  actionLabel: string;
  channelName: string;
}

export interface PlaybackCommandEvent {
  /**
   * `interruption`: something else is heard (a call, another player) or the headphones are gone.
   * `play` | `pause`: the notification's button. `stop`: the app was swiped away.
   */
  type: string;
}

/** The system voice: Android `TextToSpeech`, iOS `AVSpeechSynthesizer`. One utterance at a time. */
export interface Spec extends TurboModule {
  getVoices(): Promise<Array<NativeVoice>>;
  /** Replaces whatever is being spoken; what happens to it is reported by `onUtterance`. */
  speak(request: SpeakRequest): void;
  stop(): Promise<void>;
  isSpeaking(): Promise<boolean>;
  /** Opens the system's voice settings; rejects when there are none. */
  openSettings(): Promise<void>;
  /** Android: starts the foreground service, or changes its notification. iOS: nothing. */
  showPlayback(info: PlaybackNotice): void;
  hidePlayback(): void;
  readonly onUtterance: CodegenTypes.EventEmitter<UtteranceEvent>;
  readonly onPlaybackCommand: CodegenTypes.EventEmitter<PlaybackCommandEvent>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('AbookTts');
