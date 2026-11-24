// Public API of services/tts: the system voice behind an interface.
export { createNativePlaybackNotifier } from './createNativePlaybackNotifier';
export { createNativeTtsEngine } from './createNativeTtsEngine';
export { pickVoice } from './pickVoice';
export type { PickedVoice } from './pickVoice';
export type {
  PlaybackCommand,
  PlaybackInfo,
  PlaybackNotifier,
} from './playbackNotifier';
export { TtsError } from './types';
export type { SpeakOptions, TtsEngine, TtsErrorCode, Voice } from './types';
