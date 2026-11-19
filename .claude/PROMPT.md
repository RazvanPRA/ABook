# Prompt – Audiobook PDF (React Native + TS)

> Copy the whole content of this file into a coding agent (Claude Code). The prompt assumes the `modular-architecture`, `audiobook-storage`, `pdf-import-pipeline` and `tts-playback-engine` skills are installed.

## 1. Role and goal

You are a senior React Native engineer. You build the **Audiobook PDF** app from scratch, in React Native + strict TypeScript, **frontend only**: no backend, no account, no network at runtime.

What the app does:

- The user picks a PDF from the phone. The app copies it into its own space, extracts the text locally and saves it on the device.
- The text is read aloud through the system TTS, sentence by sentence, with the current sentence highlighted on screen.
- Progress, bookmarks and settings persist locally (AsyncStorage + the file system) and survive app restarts.
- Everything works offline, and the UI is in Romanian.

The reference UI/UX has 6 screens: Library, Empty library, PDF import, Book details, Player and Settings. Section 7 describes them. You reproduce their layout, hierarchy and states faithfully.

Mandatory working rules:

- You follow the `modular-architecture` skill **exactly**: size limits, layers, feature modules, tests and definition of done. If a rule in this prompt conflicts with the skill, the skill wins. You report the conflict.
- Before writing storage, import or player code, you load the matching skill: `audiobook-storage`, `pdf-import-pipeline`, `tts-playback-engine`.
- You work in the steps from section 8. After each step, `typecheck`, `lint` and `test` pass before you move on.

## 2. Stack and libraries

We start from **React Native CLI** (`@react-native-community/cli`), with the latest stable React Native and the New Architecture enabled. **No Expo**: no SDK, no `expo-*`, no `npx expo`. The native folders `android/` and `ios/` are part of the repo and are edited directly (no config plugins). Native library versions are chosen to be compatible with the React Native version, checking each one's documentation.

| Area | Library | Why |
| --- | --- | --- |
| Platform | `react-native` (CLI), TypeScript `strict` | Full control over the native projects, no Expo layer |
| Navigation | `@react-navigation/native`, `native-stack`, `bottom-tabs` | Stack + tabs, deep links, routes typed through `ParamList` |
| State | `@reduxjs/toolkit`, `react-redux` | Slices/selectors/thunks, as `modular-architecture` requires |
| Validation | `zod` | Any data read from storage is validated before entering the store |
| Key storage | `@react-native-async-storage/async-storage` | Metadata, progress, bookmarks, settings, chunked text |
| Files | `@dr.pogodin/react-native-fs` | PDFs live on disk, not in AsyncStorage; chunked base64 reads |
| File picking | `@react-native-documents/picker` | `types.pdf`, local copy (`keepLocalCopy`) |
| Text extraction | `react-native-webview` + locally bundled `pdfjs-dist` | The only robust offline option; the heavy work stays in the WebView, not on the JS thread |
| Voice | Custom TurboModule `AbookTts` (Android `TextToSpeech`, iOS `AVSpeechSynthesizer`), behind the `TtsEngine` interface | System TTS, Romanian voices; `react-native-tts` doesn't compile with Gradle 9 (verified in M0) |
| Lists | `@shopify/flash-list` | The library and the player text stay smooth with hundreds of items |
| Animations, gestures | `react-native-reanimated`, `react-native-gesture-handler` | Animations on the UI thread (sentence highlight, buttons) |
| Slider | `@react-native-community/slider` | The page slider, speed and pitch |
| Base UI | `react-native-safe-area-context`, `react-native-svg`, `lucide-react-native` | Outline icons, as in the mockups |
| Fonts | `.ttf` files in `assets/fonts`, linked with `react-native-asset` | Inter for text, Space Grotesk for headings |
| Splash | `react-native-bootsplash` | Native splash held until hydration finishes |
| UI texts | `i18next`, `react-i18next` | No hard-coded text; only `ro` for now |
| IDs, hash | `react-native-get-random-values` + `uuid`, `@noble/hashes` (SHA-256) | Stable IDs, fingerprint for duplicates |
| Sharing | `react-native-share` | Backup export |
| Tests | Jest (`react-native` preset), `@testing-library/react-native` | Unit, hooks, components |
| Quality | ESLint (`@react-native/eslint-config` + `typescript-eslint`), Prettier, `eslint-plugin-boundaries` or `dependency-cruiser` | Enforces the dependency direction between layers and forbids circular imports |

What you don't use:

- `redux-persist`, because persistence goes through repositories.
- Native PDF libraries that require network or external services.
- Any full UI library (kit-style), because primitives are built on tokens.
- Expo and any `expo-*` package (including through `install-expo-modules`).
- `react-native-tts` (unmaintained; doesn't compile with Gradle 9).

For background playback on iOS you add `UIBackgroundModes: ["audio"]` directly in `ios/<App>/Info.plist`, and `AbookTts` sets `AVAudioSession` to `playback`. You verify on a real device.

AsyncStorage is v3 (Room/SQLite on Android), with the `getMany` / `setMany` / `removeMany` API. Where the text below says `multiGet` / `multiSet` / `multiRemove`, you use the v3 equivalents, through the `keyValueStore` adapter.

## 3. Architecture

The app has five feature modules: `library`, `import`, `book`, `player`, `settings`. Each has a public `index.ts`. Storage, PDF extraction and voice are shared services beneath them, injected from a single place.

```
src/
  app/
    navigation/                React Navigation: RootStack (Tabs, Import modal, Book/:id) + Tabs (Library, Player, Settings), typed ParamLists, linking
    dependencies.ts            the only place where concrete implementations are bound to interfaces
    providers/                 StoreProvider, ThemeProvider, I18nProvider, PdfExtractorHost
    bootstrap.ts               hydration from storage before the first screen (splash held until the end)
  features/
    library/                   book list, search, filters, "Continuă ascultarea" card, empty state
    import/                    picker, import pipeline, progress screen, title/author/language form
    book/                      details, table of contents, bookmarks, deletion
    player/                    playback session, sentence queue, highlight, speed, sleep timer
    settings/                  voice, default speed, pitch, toggles, storage, backup
  services/
    pdf/                       PdfTextExtractor (interface) + WebViewPdfExtractor
    text/                      text cleanup, header/footer removal, sentence segmentation, chapter splitting
    tts/                       TtsEngine (interface) + NativeTtsEngine (over the AbookTts TurboModule)
  repositories/
    BookRepository.ts          interface + LocalBookRepository (AsyncStorage + FS)
    ProgressRepository.ts
    SettingsRepository.ts
  storage/
    keyValueStore.ts           adapter over AsyncStorage (multiGet/multiSet, namespacing, schema version)
    fileStore.ts               adapter over @dr.pogodin/react-native-fs
    migrations/                numbered schema migrations
  shared/
    ui/                        Button, IconButton, Chip, ChipGroup, Card, ProgressBar, Switch, ListRow, Slider, BookCover, BottomTabBar, ScreenHeader, EmptyState
    theme/                     tokens (colors, spacing, radii, typography), useTheme
    i18n/                      ro.json
    domain/                    shared types: BookId, PageNumber, SentenceIndex
    utils/                     formatting (file sizes, durations, percentages), grouped by purpose
```

App-specific rules, in addition to `modular-architecture`:

- Only repositories touch `storage/`. Features see only the `BookRepository`, `ProgressRepository` and `SettingsRepository` interfaces.
- `player` doesn't import from `library` or `book`. It gets the book through the public selectors in `book/index.ts`.
- `services/pdf` and `services/tts` don't know about Redux. They receive and return typed data and emit events through callbacks.
- `WebViewPdfExtractor` needs a mounted WebView. `PdfExtractorHost` mounts it once, hidden, in `app/providers`, and exposes the extractor through `dependencies.ts`.

## 4. Data model and storage

The PDF lives on disk, and everything that is text or state lives in AsyncStorage, split into small keys. The reason: on Android, AsyncStorage has a small default total limit (in v1 ~6 MB, configurable through `AsyncStorage_db_size_in_MB`), and a single large value can fail on read. You check the exact limits in the documentation of the installed version and set the limit directly in `android/gradle.properties`.

| Key | Content | Written |
| --- | --- | --- |
| `abk:schemaVersion` | number | on migration |
| `abk:books` | `BookId[]` in library order | on import / deletion |
| `abk:book:{id}:meta` | `BookMeta` | on import, on edit |
| `abk:book:{id}:toc` | `Chapter[]` | once, at the end of import |
| `abk:book:{id}:ch:{n}` | `ChapterChunk` (sentences + their pages) | once, in `multiSet` batches |
| `abk:book:{id}:progress` | `Progress` | throttled, see below |
| `abk:book:{id}:bookmarks` | `Bookmark[]` | on add / delete |
| `abk:settings` | `Settings` | 500 ms debounce |

The PDF file: `DocumentDirectoryPath/books/{id}.pdf`.

```ts
type BookStatus = 'processing' | 'ready' | 'failed';

interface BookMeta {
  id: BookId; title: string; author: string; language: 'ro-RO' | 'en-US';
  fileUri: string; fileSizeBytes: number; pageCount: number;
  chapterCount: number; sentenceCount: number;
  status: BookStatus; processedPages: number; importedAt: string; // ISO
  coverColor: string; // palette token, picked deterministically from the id
}
interface Chapter { index: number; title: string; startPage: number; endPage: number; sentenceCount: number; }
interface ChapterChunk { sentences: string[]; sentencePages: number[]; } // sentencePages[i] = page of sentence i
interface Progress { chapter: number; sentence: number; page: number; finished: boolean; updatedAt: string; }
interface Bookmark { id: string; chapter: number; sentence: number; page: number; excerpt: string; createdAt: string; }
interface Settings {
  voiceId: string | null; defaultRate: number; pitch: number;
  highlightSentence: boolean; skipHeadersFooters: boolean; backgroundPlayback: boolean;
  fontScale: 0 | 1 | 2;
}
```

Storage rules:

- All the types above have a `zod` schema in `model/schemas.ts`. Values are validated on read, and an invalid value is logged and treated as missing, without a crash.
- A serialized `ChapterChunk` stays under ~256 KB. A larger chapter is split into `ch:{n}:p:{k}`.
- Write order on import: first the file, then `meta` with `processing`, then the chunks, `toc` and finally `meta` with `ready`. On startup, a book left `processing` is resumed or marked `failed`.
- Progress is written at most once every 3 s during playback, plus immediately on pause, on chapter change and on `AppState` → `background`.
- On deletion: `multiRemove` on all the book's keys, then the file. No orphan keys remain.
- "Exportă backup" (Export backup) writes a JSON `{ schemaVersion, exportedAt, entries }` with all `abk:*` keys, without PDFs, and shares it via `react-native-share`. "Importă backup" (Import backup) validates it before writing anything.
- The storage screen shows the size of the PDF files (from FS) and an estimate of the AsyncStorage data (length of the serialized values).

## 5. PDF import pipeline

Import is a state machine that goes page by page. The user can listen to the first chapter before the rest is processed, as the Import screen shows.

1. **Pick.** `@react-native-documents/picker` with `types.pdf`. You reject files above a configurable threshold (default 100 MB), with a clear message.
2. **Copy.** You move the file to `DocumentDirectoryPath/books/{id}.pdf`, then write `meta` with `status: 'processing'`.
3. **Open.** `PdfTextExtractor.open(uri)` reads the file as base64 in chunks and sends it to the WebView. pdf.js (the legacy build, worker inlined locally) returns `pageCount` and the `Title` / `Author` metadata, used to prefill the form.
4. **Per-page extraction.** `getTextContent()` for each page, in batches of 5 pages. Each page comes back through `postMessage` as `{ page, lines: { text, y, height }[] }`. Progress (`processedPages`) updates the bar in the UI.
5. **Cleanup** (`services/text`, pure functions):
    - you remove repeated headers and footers: lines in the top/bottom zone that appear on ≥ 50% of pages, after digit normalization;
    - you remove isolated page numbers;
    - you join words hyphenated at the end of a line;
    - you unify whitespace and diacritics (ş/ţ with cedilla become ș/ț with comma below).
6. **Sentence segmentation.** A custom segmenter, with rules for Romanian abbreviations (dl., dna., nr., pag., ș.a., etc.), „” quotes and dialogue with a dialogue dash. Sentences over ~400 characters are cut at a comma or semicolon, so the TTS stays responsive.
7. **Chapters.** You use the PDF outline (`getOutline`) if it exists. Otherwise you detect headings (short lines, larger font, of the "Capitolul", "Partea" or Roman-numeral kind). Otherwise you split every ~10 pages.
8. **Save.** Each complete chapter is written immediately with `multiSet`. After the first chapter, the book is playable.
9. **Finish.** You write `toc`, then `meta` with `status: 'ready'`.

Cases to handle explicitly:

- **Scanned PDF**, recognized when the first 5 pages have under 20 characters each. You stop the import and explain that a PDF with text is needed.
- **Password-protected or corrupt PDF.** You show a clear error and delete the copied file.
- **Cancellation halfway.** You fully clean up the keys and the file.
- **App killed during import.** On the next start you resume from `processedPages`.
- **Duplicate file.** You compare a fingerprint (size + first 64 KB, SHA-256 with `@noble/hashes`) and ask whether the user wants a copy.

The WebView has no network access (restricted `originWhitelist`, no external `fetch`). Messages received from it are validated with `zod`.

## 6. The voice engine and the player

The player reads **one sentence per utterance**. That way, highlighting, skipping back/forward and saving progress are exact on every platform, without depending on the TTS word events.

```ts
interface TtsEngine {
  listVoices(language: string): Promise<Voice[]>;
  speak(text: string, opts: { voiceId: string | null; rate: number; pitch: number;
    onStart(): void; onDone(): void; onError(e: TtsError): void }): void;
  stop(): Promise<void>;
  isSpeaking(): Promise<boolean>;
}
```

The playback session (`features/player`):

- The state is `idle | loading | playing | paused | ended | error` and changes only through actions: `play`, `pause`, `seekSentence(delta)`, `seekPage(page)`, `seekChapter(n)`, `setRate`, `setSleepTimer`.
- Through **prefetch**, the current chapter and the next one stay in memory. Chapters are loaded from AsyncStorage on demand, and at most 3 stay in the cache.
- **The chain:** on `onDone` you move to the next sentence. At the end of the chapter you move to the next one, and at the end of the book you mark `finished: true`.
- **Pause** calls `stop()` and keeps the sentence index. Resuming starts from the beginning of the current sentence. After a pause longer than 5 minutes, you resume one sentence back, for context.
- Rapid commands are protected with a **generation token**: each `speak` gets a token, and an `onDone` with an old token is ignored. That way no sentences are skipped when the user presses quickly.
- **Speed** has the steps 0.75, 0.9, 1.0, 1.25, 1.5 and 2.0. It applies from the next sentence, or immediately, by restarting the current sentence.
- **The sleep timer** has the options 15 min, 30 min and "end of chapter". When it expires, playback stops at the end of the current sentence, not in the middle of it.
- **Remaining time** is estimated from the remaining characters divided by the measured speed (characters/second, moving average over the last 20 sentences). It's displayed as "~ 1 h 52 min rămase" (~ 1 h 52 min left).
- **Interruptions:** on `AppState` → `background`, with background playback disabled, you pause and save progress. On a TTS error you retry the same sentence once, then go to `error` with a message and an "Încearcă din nou" (Try again) button.
- **The voice:** if the saved voice no longer exists on the device, you pick the first available `ro-RO` voice and notify the user. If there's no Romanian voice at all, you explain how to install one from the system settings.

Highlighting in the text:

- The chapter text is displayed in a `FlashList` with one item per paragraph (sentences grouped into paragraphs). The item is `React.memo`, and the comparator only considers whether the active sentence is in that paragraph.
- The active sentence has an accent background at 18% opacity. Sentences already read are dimmed. The transition is done with Reanimated, in 150 ms.
- The list auto-scrolls so the active sentence sits in the top third. If the user scrolls manually, auto-scroll is suspended and an "Înapoi la fraza curentă" (Back to current sentence) button appears.
- Tapping a sentence makes it the current sentence, and a long press adds a bookmark with its excerpt.

## 7. Screens, components and design tokens

The theme is dark, with a single amber accent. All the values below become tokens in `shared/theme`; no component uses hex directly.

| Token | Value | Use |
| --- | --- | --- |
| `color.bg` | #111316 | screen background |
| `color.surface` | #1B1E23 | cards, inputs |
| `color.surfaceRaised` | #252931 | secondary buttons, select |
| `color.border` | #2E333B | outlines, progress bar track |
| `color.divider` | #22262C | separators between rows |
| `color.tabBar` | #15181C | the bottom navigation bar |
| `color.text` | #F2EFE9 | primary text |
| `color.textMuted` | #A3A9B3 | secondary text, labels |
| `color.textRead` | #8A9099 | sentences already read |
| `color.accent` / `color.onAccent` | #F0B13C / #1A1405 | primary action, progress, active element |
| `color.success` / `color.successBg` | #7FD8B4 / #2B4A3E | completed step, chapter listened to |
| `color.danger` / `color.dangerBorder` | #F08A8A / #4A2E2E | destructive actions |
| `color.info` | #8FA8FF | the PDF segment in the storage bar |
| `color.cover[]` | #3B4A6B, #6B3B3B, #3B6B57 | generated covers (picked from the id hash) |
| `space` | 4, 8, 12, 16, 20, 24 | screen padding 20, card gap 14–16 |
| `radius` | 6, 8, 12, 14, 16, 20, pill | small cover 6, input 12, primary button 14, card 16–20 |
| `type.display` | Space Grotesk 28/700 | screen title |
| `type.title` | Space Grotesk 20–24/600–700 | book title, header |
| `type.body` | Inter 15–16/400–600 | text, list rows |
| `type.caption` / `type.overline` | Inter 12–13 / 12/600 uppercase, 0.08em letter spacing | metadata / section titles |

The screens:

| Screen | Route | Content | States |
| --- | --- | --- | --- |
| Library | `Tabs/Library` | header + settings button, search, "Continuă ascultarea" card with play, chips Toate / În curs / Terminate, book list (cover, title, author, progress), "Importă PDF" FAB | loading (skeleton), empty, no search results, book being processed (import bar in the row) |
| Empty library | same route | illustration, title, offline explanation, "Importă primul PDF" button, note about scanned PDFs | — |
| PDF import | `Import` (modal) | file card + "Schimbă", processing steps with status (done / in progress with page X/Y / waiting), title / author / voice language form, "Adaugă în bibliotecă" button | per-step error, scanned PDF, duplicate, cancellation |
| Book details | `Book` (`{ id }`) | large cover, title, author, metadata chips, "Continuă de la pagina N", progress, table of contents with per-chapter status, bookmarks, "Șterge de pe dispozitiv" (with confirmation) | book being processed, failed book (retry) |
| Player | `Tabs/Player` | header with the chapter, bookmark, text with the highlighted sentence, page slider + remaining time, controls (page ←, sentence ←, play/pause 76 pt, sentence →, page →), speed, sleep, text size | no book chosen, loading, voice error, end of book |
| Settings | `Tabs/Settings` | voice (select), speed and pitch (sliders), "Ascultă o mostră", toggles (highlight, headers, background), storage (PDF vs AsyncStorage bar, backup export/import, deleting extracted text) | no Romanian voice installed |

The primitives in `shared/ui` (`Button` with the primary, secondary, ghost and danger variants; `IconButton`, `Chip`, `ChipGroup`, `Card`, `ProgressBar`, `Switch`, `ListRow`, `Slider`, `BookCover`, `BottomTabBar`, `ScreenHeader`, `EmptyState`) are built first and reused on all screens. A persistent mini-player above the tab bar appears on Library and Settings while a book is playing.

## 8. Quality and order of work

Performance (targets verified on a mid-range Android, in a release build):

- **Startup:** first useful screen in under 1.5 s. At boot you hydrate only `abk:books`, the `meta`s and `settings`, in a single `multiGet`. Text is loaded on demand.
- **Smoothness:** 60 fps when scrolling the library and the player text. You use `FlashList`, `React.memo` items, memoized selectors with `createSelector` and stable callbacks.
- **Import:** the JS thread stays free, and the UI responds during import. Parsing stays in the WebView, and cleanup and segmentation run in batches, yielding (`await` between batches).
- **Memory:** at most 3 chapters in the cache. The PDF is never held fully in JS; it's sent to the WebView in chunks.
- **Writes:** progress is throttled, settings are debounced, and import writes in `multiSet` batches.

Accessibility:

- Touch target of at least 44 pt.
- `accessibilityRole`, `accessibilityState` and a Romanian `accessibilityLabel` on every control.
- The current sentence is announced by VoiceOver/TalkBack only on request, so it doesn't overlap the TTS.
- Text contrast of at least 4.5:1.
- Support for system font enlargement (capped at 1.4× in headers).

Tests (in addition to the `modular-architecture` requirements):

- `services/text`: repeated headers, hyphens at line end, Romanian abbreviations, dialogue, cedilla diacritics, very long sentences, empty text.
- Repositories, with an in-memory `keyValueStore`: write order on import, resume after crash, deletion without orphan keys, corrupt values, migrations.
- The playback session, with a fake `TtsEngine`: the sentence chain, generation token on rapid presses, moving to the next chapter, the sleep timer, speed change, end of book.
- Components: every primitive and every state in the screens table.

Order of work (each step ends with green `typecheck`, `lint` and `test` and a summary per `modular-architecture`):

1. React Native CLI project, strict TS, ESLint with layer rules, Jest, React Navigation with empty tabs, fonts.
2. `shared/theme` (tokens) and `shared/ui` (all primitives, with tests).
3. `storage/`, repositories, the `zod` schemas, migrations and `dependencies.ts`.
4. `services/text` (pure, fully covered by tests).
5. `services/pdf` with `PdfExtractorHost` and the `import` feature.
6. The `library` feature, with the empty state and the book being processed.
7. The `book` feature.
8. `services/tts` and the `player` feature, plus the mini-player.
9. The `settings` feature, with storage and backup.
10. Performance and accessibility pass on a real device; you fix whatever doesn't meet the targets above.

Definition of done for the whole app:

- [ ] A 300+ page text PDF imports without blocking the UI, and the first chapter can be listened to before the end.
- [ ] After the app is killed, playback resumes at the same sentence.
- [ ] A scanned, a protected and a corrupt PDF give clear messages and leave no data behind.
- [ ] Deleting a book frees all the space it occupied.
- [ ] A backup exported and re-imported on a clean install restores the library (without PDFs) and progress.
- [ ] All 6 screens match the mockups, in all the states in the table.
