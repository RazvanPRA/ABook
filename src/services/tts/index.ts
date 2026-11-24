// Public API of services/tts: the system voice behind an interface.
export { createNativeTtsEngine } from './createNativeTtsEngine';
export { pickVoice } from './pickVoice';
export type { PickedVoice } from './pickVoice';
export { TtsError } from './types';
export type { SpeakOptions, TtsEngine, TtsErrorCode, Voice } from './types';
