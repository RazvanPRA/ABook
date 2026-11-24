# M5 – Voice and player

Branch: `m5-player`, from `dev` after M4 (`m4-library-details`, `8de3dbb`) is merged into it. References: `PLAN.md` (M5, risks), `PROMPT.md` §3, §4, §6, §7, §8, the `modular-architecture`, `tts-playback-engine` and `audiobook-storage` skills, the mockup `.claude/design/04-player.png`, `M4-library-details.md`.

## Context and goal

M4 ends at `playbackRequested`, an action nobody handles, and an empty Ascultă tab. M5 makes the app read: the system TTS speaks a book sentence by sentence, with highlighting, seeking, speed, sleep timer and bookmarks, and keeps the position. After the app is killed, playback resumes at the same sentence.

Out of scope: the Settings screen (voice list, pitch, sample, toggles), backup (M6); lock-screen and headset controls; release-build performance, TalkBack itself, iOS on a device (M7).

## Decisions

Confirmed by the owner (2026-11-24):

1. **Android background playback uses a simple foreground service** (`mediaPlayback`), with a notification (book title, Pause / Play). No MediaSession.
2. **The player's speed writes `settings.defaultRate`:** it survives a restart and applies to every book.
3. **The Ascultă tab hides the tab bar** while it shows a book, as in the mockup. The chevron returns to the previous tab. With no book, the tab bar stays.
4. **Paragraphs are derived when reading**, by a pure function over `ChapterChunk`. No schema change, no re-import.

Standing (M4 decisions 7 and 8): English code and docs, Romanian UI copy through `ro.json`. On the emulator **only the PDFs from `C:\ModDeInvatare\Book-PDF`**, so the generated `ion-320.pdf` named in `PLAN.md` isn't used: `ro-RO` is checked by importing one of them with the voice language set to Romanian.

## Design

### Findings that shape it

- **JS timers stop in the background on Android.** `JavaTimerManager.onHostPause` (RN 0.88) removes the frame callback. So the sleep timer and the progress throttle compare against an injected clock **at sentence boundaries**; timers only serve what is on screen. Native events and promises keep running.
- **TTS is invisible without `<queries>`** for `android.intent.action.TTS_SERVICE` (Android 11+).
- **Books hold their own language**, but `settings.voiceId` is global: it applies only when the voice's language matches the book's; otherwise the first offline voice of the book's language. This generalizes the skill's "first `ro-RO` voice", since the samples are `en-US`. *(Reported deviation.)*
- **Voices that need the network or aren't installed are filtered out** (offline app).
- **The toc has sentence counts, not characters.** Remaining time is exact in the loaded chapters; elsewhere `sentenceCount` × the average sentence length seen so far.
- **The page slider needs a 44 pt target now**, so the Slider risk assigned to M6 in `PLAN.md` is solved here.
- **Nested `Text` on Android has no rounded background**, and animating it with Reanimated under Fabric is unproven: spike in step 10.
- **Deleting a book races with progress writes.** The player must stop and finish its write before `deleteBook` lists the keys, or an orphan `progress` key remains; the same holds for `resetProgress`.

### Structure

```
specs/NativeAbookTts.ts              Codegen spec; codegenConfig in package.json
android/…/com/abook/tts/             AbookTtsModule, TtsVoices, SpeechFocus, PlaybackService, AbookTtsPackage
ios/ABook/Tts/                       AbookTts (ObjC++ / Swift), added to project.pbxproj
src/services/tts/                    TtsEngine, createNativeTtsEngine, pickVoice, testing/FakeTtsEngine
src/services/bookRelease/            BookRelease: awaited "let go of this book" (player registers; book calls)
src/features/player/
  services/  session/ (controller), chapterCache, progressWriter, paragraphs, position, remainingTime, sleepTimer
  state/     playerSlice, selectors, playerListeners, thunks
  hooks/     usePlaybackSession, useActiveSentence, useSleepTimer, useRemainingTime, useAutoScroll
  components/ screens/
```

- **`PlaybackSession`** is a plain controller with injected ports (`TtsEngine`, chapter reader, progress writer, clock, `onChange`): no Redux, no React. One per store, kept by `extra` in a `WeakMap`, like `discardedBooks`. The slice mirrors its snapshot; thunks call it.
- **`playerListeners`** (RTK listener middleware, added in `createAppStore`) handles `playbackRequested`, `bookUpserted`, `bookRemoved` and settings changes. Feature direction: `player → book, settings`; `library` symbols come through `book/index.ts`. Nothing imports `player` except `app`.
- **`libraryProgress` is updated only when progress is written** (≤ once per 3 s), so the library isn't re-sorted at each sentence.
- **Two engine additions to the contract in `PROMPT.md` §6:** `onInterruption` (call, focus loss, headphones unplugged → pause) and `openSettings` (Android voice settings).

### States

| Session | Screen |
| --- | --- |
| idle, no book | `EmptyState` "Nicio carte aleasă" + "Mergi la bibliotecă" |
| idle, a book was started before | that book, loaded `paused` at its position (cold start of the tab) |
| loading | skeleton of the text card; controls disabled except the chevron |
| loading, waiting | end of the saved chapters of a book still importing: "Se pregătește capitolul următor"; continues by itself on `bookUpserted` |
| playing / paused | the mockup |
| ended | "Ai terminat cartea" + "Ascultă din nou" |
| ended, incomplete | a stalled or failed import ran out of chapters: message + "Vezi cartea"; **not** `finished` |
| error: speech | message + "Încearcă din nou" |
| error: no voice for the language | how to install one + "Deschide setările de voce" (Android) |
| error: text missing | chapter missing or corrupt + "Sari la capitolul următor" |

### Rules of the session

- Each `speak` gets a new token; callbacks with an old one are ignored. Every seek, pause, rate change and book change raises it.
- Pause keeps the sentence; after more than 5 minutes resume starts one sentence back (the previous chapter's last one if needed).
- Positions are clamped to the stored text; chapters without sentences are skipped.
- `seekPage(p)`: chapter by `startPage`/`endPage`, then its first sentence with a page ≥ p; limited to saved chapters.
- Rate, pitch or voice change restarts the current sentence when playing.
- Sleep: 15 min, 30 min, end of chapter, off. Checked in `onDone`; the sentence always ends. Not persisted.
- Progress: at most every 3 s at sentence starts, plus a trailing write in the foreground; immediately on pause, chapter change, end, book change and `AppState` → `background`. A force-stop in the foreground can lose up to 3 s.
- `finished` is written only for a `ready` book.

## Steps

Each step ends with a green `npm run check` and a separate commit; its section is completed with "**Done** (date). Findings: …".

### M5a – Voice

#### 1. Branch and plan
- This plan; `PLAN.md` M5 points to it (Book-PDF only; the Slider risk moved here; new risks: JS timers in background, sentence highlight, foreground service).

#### 2. Codegen spec and Android module
- `specs/NativeAbookTts.ts`: `getVoices`, `speak({ id, text, voiceId, language, rate, pitch })`, `stop`, `isSpeaking`, `openSettings`, and one typed event `onUtterance { id, type: start | done | error, code }`. Check the RN 0.88 Codegen `EventEmitter` type first (it isn't at the old `Libraries/Types` path).
- `AbookTtsModule` (Kotlin): lazy init with a queue until ready, `QUEUE_FLUSH`, our own utterance ids, language normalization (`ro_RO`, `ron` → `ro-RO`), engine-missing error, shutdown on invalidate. Registered in `MainApplication` (`getPackages`).
- Manifest `<queries>`; `__tests__/native` guards it.
- **Emulator:** a dev screen `abook://dev/tts` lists voices and speaks a sentence in `ro-RO` and `en-US`. Record which voices the image has.

**Done** (2026-11-24). Findings:

- Codegen in the app itself works: `codegenConfig` (`AbookSpecs`, `specs/`) generates `com.abook.specs.NativeAbookTtsSpec`; the event type is `CodegenTypes.EventEmitter` from `react-native`.
- `TextToSpeech` is wrapped in `SpeechEngine`, on its own `HandlerThread`, because its calls cross processes; a dead engine is dropped and created again by the next call.
- The emulator image has Google TTS with 16 offline voices, all English. **`ro-RO` without a voice doesn't fail:** the engine reports start and done. So the session never speaks without a picked voice.
- The dev screen uses `TtsEngine`, so it was committed with step 3.

#### 3. `services/tts`
- `TtsEngine`, `createNativeTtsEngine` (routes events by id; late ones are dropped), `FakeTtsEngine` (completes on demand, can fail), `pickVoice` (saved → first of the language → none). Jest mock of the module in `jest.setup.js`; wired in `dependencies.ts`, `FeatureDependencies` and `fakeServices`.
- **Tests:** event routing, stop, late events, error mapping, a voice that is missing / in another language / absent.

**Done** (2026-11-24). Findings:

- `listVoices()` returns every offline voice, not one language's: `pickVoice` has to tell "the saved voice is gone" (notice) from "it speaks another language" (silent).
- `speak` also takes the book's `language` *(addition to the contract of `PROMPT.md` §6)*.
- Emulator: start / done arrive once per sentence; nothing arrives after `stop`.

#### 4. iOS module
- `AVSpeechSynthesizer`, `AVAudioSession` `playback`, interruption and route-change notifications; rate mapped to the AVSpeech scale.
- Can't be compiled on this PC: written and reviewed, **verified in M7**.

**Done** (2026-11-24). Findings:

- Objective-C++ only (`AbookTts.h` / `.mm`), because the generated base class with the event emitters can't be subclassed from Swift. Checked against the generated iOS header (`generate-codegen-artifacts.js -t ios`); **not compiled**.
- iOS has no link to the voice settings: `openSettings` rejects there. Voices are always offline. Rates above 1 are compressed (2.0 → 0.65), to be tuned by ear in M7.

#### 5. Audio focus and foreground service
- `SpeechFocus` (focus request, `ACTION_AUDIO_BECOMING_NOISY`) → `onInterruption`. `PlaybackService`: started on play from the foreground, kept while paused, stopped on idle, end or delete; notification texts come from JS (`ro.json`). Its action arrives as an event, so the session stays the only owner of the state.
- Permissions `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `POST_NOTIFICATIONS` (asked once, on first play; playback works if refused). Only with `backgroundPlayback` on. Release still has no network permission.
- **Tests:** manifest guards; the engine's interruption events. **Emulator:** screen off for 10 min; pause from the notification; swiped-away app stops.

**Done** (2026-11-24). Findings:

- **Done before step 4**, so the iOS module is written once, over the final spec.
- Focus loss and unplugged headphones are `TtsEngine.onInterruption`; being asked to duck (a notification sound) is ignored. The notification is a separate port, `PlaybackNotifier` (`show` / `hide` / `onCommand`): features own the texts and decide when, the service only passes commands on. Both come over one native event.
- The service holds a partial wake lock while playing (plan B in the risks), since sentences start from JS.
- It is not sticky: without JS there is nothing to play.
- The 10-minute and notification checks need the player, so they are in step 15.

### M5b – Session

#### 6. Pure services
- `nextPosition` / `previousPosition`, `positionOfPage`, `clampPosition`, `createChapterCache` (LRU 3, one read per chapter in flight, prefetch at 80%, `clear`), `remainingTime` (moving average over 20 sentences; on a rate change the speed is scaled, not forgotten), `sleepTimer`, `groupParagraphs` (page change, dialogue dash, ~600 characters; a sentence is never split).
- **Tests:** table-driven; empty chapters, page gaps, one long sentence, first and last positions, failed read retried.

#### 7. Playback session
- The controller with the rules above, split by concern (transport, navigation, speech, errors) under 200 lines per file.
- **Tests** (`FakeTtsEngine`, fake clock): chain, chapter rollover, end of book, ten quick taps, seek while loading, pause > 5 min, rate mid-sentence, sleep (each option), error → retry → `error` → retry, voice fallback and none, waiting for an import, incomplete book, missing chapter, another book while playing, **no JS timers running**.

#### 8. Store, progress and lifecycle
- `playerSlice`, selectors, thunks, `playerListeners`, `createProgressWriter` (serial, latest wins, `drain`). A failed write is logged and retried at the next sentence.
- `settings`: `settingsChanged` and a 500 ms debounced save, flushed on background (used by speed and text size; M6 reuses it).
- `BookRelease`: `deleteBook` and `resetProgress` await it; the player stops, drops pending writes, drains the current one and refuses new ones for a deleted book.
- `AppState` → `background`: flush; with `backgroundPlayback` off also pause.
- **Tests:** throttle and every flush; delete while playing leaves no key, with a write in flight too; reset while playing; `playbackRequested` from the three callers (card, book button, chapter / bookmark); boot reads no chapter.

#### 9. Bookmarks from the player
- `addBookmark` in `features/book` (excerpt of ~120 characters, id from `uuid`, refused while deleting, rollback on a failed write). The header button toggles the current sentence; a second add of the same sentence changes nothing.
- **Tests:** add, duplicate, failure, add while a removal waits for its undo.

### M5c – Player screen

#### 10. Highlight spike (emulator)
- Compare: (a) nested Reanimated text; (b) an overlay from `onTextLayout`; (c) plain styles without a transition. Choose with numbers on a chapter of `Microservices-Patterns.pdf`; (c) is the fallback, reported as a deviation.

#### 11. Text card
- `PlayerText` (FlashList, one item per paragraph), `ParagraphItem` (`React.memo`, re-rendered only when the active sentence enters, leaves or moves in it), `SentenceSpan`; tap = seek, long press = bookmark; bottom fade; `fontScale` 0/1/2; `highlightSentence` off.
- `useAutoScroll`: top third, suspended by a manual drag (not by its own scrolls), "Înapoi la fraza curentă".
- Accessibility: a paragraph is one element with actions (read from here, add bookmark); nothing is announced by itself.
- **Tests:** render counts, tap, long press, suspended and restored scroll, contrast of the new text tokens on the highlight.

#### 12. Controls and slider
- `Slider` rebuilt with Gesture Handler + Reanimated, same API, 44 pt, `increment` / `decrement` actions, plus a track-only form for the page slider; the old dependency is removed. While dragging, only the label moves; the seek is on release.
- `PlayerHeader`, `PageSlider` ("Pagina 34", "~ 1 h 52 min rămase", "82"), `TransportControls` (page ←, sentence ←, 76 pt, sentence →, page →), `PlayerOptions` (speed, sleep, Aa) over `MenuSheet`; the sleep button shows what is active.
- **Tests:** each control and its accessibility state, disabled edges (first and last page).

#### 13. Screen, states and tab bar
- `PlayerScreen` with every row of the states table; the voice-fallback notice in a `Snackbar`. Route adapter in `TabsNavigator`; `TabBarAdapter` hides the bar on a player with a book; the chevron and Android back return to the previous tab, also after a cold `abook://player`.
- **Tests:** every state over the real repositories (`app/__tests__`, `fakeApp`).

#### 14. Mini-player
- `MiniPlayer` (cover, title, chapter, play / pause, progress; tap opens the player), drawn by `TabBarAdapter` above the bar on Library and Settings while `loading`, `playing`, `paused` or `error`. The FAB and the last list row stay reachable.
- **Tests:** visibility per state and tab; only the mini-player re-renders at a sentence.

### M5d – Closing

#### 15. Emulator verification
Only with Book-PDF:
- **Kill:** `adb shell am kill` in background and `am force-stop` → the same sentence (force-stop: at most 3 s behind).
- 30 minutes of playback, across chapters and with the screen off; listening to a book while it imports; delete while playing (keys and files as before, `abook://dev/storage`).
- Ten quick taps; speed change; sleep 15 min with the screen off; another app taking the focus.
- `ro-RO` through an import with Romanian as the voice language, or the "no voice" state if the image has none; engine disabled.
- `uiautomator` labels and sizes, font scale 2.0, comparison with mockup 04; the M4 gaps now reachable (continue card, listening states, bookmarks).

#### 16. Closing
- `modular-architecture` §10 checklist, summary of units, `PLAN.md` (M5 ✅, risks), `CLAUDE.md` (M5 pitfalls, `abook://dev/tts`).

## Reused

`playbackRequested`, `selectBookById`, `selectBookProgress`, `progressChanged`, `loadBookContent` / `selectBookContent`, `chapterTitle`, `pickContinueListening` (exported through `book`), `BookRepository.getChapter`, `ProgressRepository`, `formatDuration`, `romanianPlural`, `IconButton` (`filled`, 76 pt), `ScreenHeader` (compact, `chevron-down`), `MenuSheet`, `Snackbar`, `EmptyState`, `Skeleton`, `duration.highlight`, `opacity.highlight`, `fakeApp`, `fakeServices`.

## Risks

| Risk | Step | Plan B |
| --- | --- | --- |
| Codegen for a module inside the app (first one here) | 2 | hand-written `TurboModule` class over the generated spec only on Android |
| No `ro-RO` voice on the emulator | 2, 15 | `en-US` + the "no voice" state; Romanian on a real phone in M7 |
| Animated highlight in nested text | 10 | overlay, or no transition |
| Scrolling to a sentence inside a tall paragraph | 11 | offset estimated from characters; smaller paragraphs |
| Foreground service start refused (Android 12+) | 5 | start only from the foreground; playback goes on without it |
| Slow or lost native events with the screen off | 5, 15 | partial wake lock while playing |
| iOS module not compiled until M7 | 4 | — |

## Definition of done – M5

- [ ] After a kill, playback resumes at the same sentence (emulator).
- [ ] No sentence is skipped or doubled on quick taps (Jest and emulator).
- [ ] Playback, sleep and progress work with the screen off for 10+ minutes.
- [ ] Deleting or restarting a book while it plays leaves no stray keys and no old position.
- [ ] Every state in the table is built and tested; mockup 04 matches.
- [ ] At most 3 chapters in memory; one active-sentence change re-renders at most two paragraphs.
- [ ] No circular or internal cross-feature imports; `npm run check` green; one commit per step.
