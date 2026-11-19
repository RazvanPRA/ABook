---
name: tts-playback-engine
description: Player rules for the Audiobook PDF app: sentence-per-utterance TTS behind a TtsEngine interface, generation tokens, highlight, sleep timer, progress. Use for player code.
---

# TTS playback engine

Applies together with `modular-architecture` and `audiobook-storage`.

## Engine contract

`services/tts/TtsEngine.ts` exposes `listVoices(lang)`, `speak(text, { voiceId, rate, pitch, onStart, onDone, onError })`, `stop()` and `isSpeaking()`. `NativeTtsEngine` is the implementation, over the app's own TurboModule `AbookTts` (Codegen spec `specs/NativeAbookTts.ts`; Android `TextToSpeech`, iOS `AVSpeechSynthesizer` with an `AVAudioSession` `playback` category). Do not use `react-native-tts`: it does not build with Gradle 9 (verified in M0). It is wired in `app/dependencies.ts`; features see only `TtsEngine`. No Expo packages. Tests use `FakeTtsEngine`, which completes utterances on demand.

## Core model

- One sentence = one utterance. Never send a whole chapter to TTS.
- Position = `{ chapter, sentence }`; the page is derived from `sentencePages`.
- Session state: `idle | loading | playing | paused | ended | error`. Transitions only through actions (`play`, `pause`, `seekSentence(delta)`, `seekPage`, `seekChapter`, `setRate`, `setPitch`, `setSleepTimer`).
- Generation token: increment it on every `speak`; ignore `onDone` / `onError` carrying an old token. This prevents skipped or doubled sentences on fast taps.
- On `onDone`: next sentence, then the next chapter; at the end of the book, `finished: true` and state `ended`.
- Pause = `stop()` and keep the index. Resume restarts the current sentence. After more than 5 minutes paused, resume one sentence earlier.
- A rate or voice change restarts the current sentence with the new settings.
- Sleep timer: 15 min, 30 min or end of chapter. On expiry, stop at the end of the current sentence.
- Errors: retry the same sentence once, then go to `error` with a retry action.
- Voice fallback: if the saved voice is missing, use the first `ro-RO` voice and notify. If there is none, explain how to install one from system settings.

## Data loading

- Load chapters on demand from the repository. Keep at most 3 in an LRU cache and prefetch the next chapter when 80% through the current one.
- Remaining time = remaining characters / measured chars-per-second (moving average over the last 20 sentences at the current rate).

## Progress

Progress is saved through `ProgressRepository` with the throttle and flush rules in `audiobook-storage`. Writes never happen from components.

## UI

- The text is a FlashList with one item per paragraph. Items are `React.memo` and re-render only when the active sentence enters or leaves them.
- Active sentence: accent at 18% opacity behind it; read sentences use `color.textRead`; a 150 ms Reanimated transition.
- Auto-scroll keeps the active sentence in the top third. A manual scroll pauses auto-scroll and shows a "Înapoi la fraza curentă" button.
- Tap a sentence to jump to it; long-press to add a bookmark with its excerpt.
- Hooks are split by concern: `usePlaybackSession`, `useActiveSentence`, `useSleepTimer`, `useRemainingTime`, `useAutoScroll`.

## Background and lifecycle

- On iOS, add `UIBackgroundModes: ["audio"]` directly in `ios/<App>/Info.plist`. Check background speech on a real device; if it stops, switch the engine implementation.
- On `AppState` -> `background` with background playback off: pause and flush progress.

## Testing

With `FakeTtsEngine`, cover the sentence chain, chapter rollover, end of book, fast-tap token safety, rate change mid-sentence, the sleep timer (fake timers), the error retry and the voice fallback.
