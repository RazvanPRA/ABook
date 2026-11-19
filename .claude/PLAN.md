# Work plan – Audiobook PDF

Source: `.claude/PROMPT.md` (requirements), the skills in `.claude/skills/` (`audiobook-storage`, `pdf-import-pipeline`, `tts-playback-engine`) and the installed `modular-architecture` skill.

**Platform: React Native CLI, no Expo** (user decision, 2026-11-18; `PROMPT.md` §2 and the project skills were updated accordingly).

Working branch: `dev`. Each milestone is closed with a commit (or a PR to `main`) only after:

- `npm run typecheck`, `npm run lint` and `npm test` are green;
- the *Definition of done* checklist from `modular-architecture` (section 10) is ticked;
- the summary lists the new units, the reused ones and any `arch-exception`.

## Cross-cutting rules (apply to every milestone)

| Source | Rule |
| --- | --- |
| `modular-architecture` | Component ≤ 150 lines (JSX ≤ 80), screen ≤ 120, hook ≤ 80, function ≤ 40, service file ≤ 200, ≤ 7 props, ≤ 3 parameters, JSX ≤ 4 levels, complexity ≤ 10 |
| `modular-architecture` | Dependencies only downward: app → features → services → repositories → storage; `shared` is used by everyone. Between features only through `index.ts` |
| `modular-architecture` | Component = folder with `.tsx`, `.styles.ts`, `.types.ts`, `use*.ts`, `.test.tsx` and `index.ts` |
| `modular-architecture` | No hex, magic numbers or hard-coded texts; only tokens and i18n |
| `audiobook-storage` | Only `storage/` and `repositories/` touch AsyncStorage and `@dr.pogodin/react-native-fs`. Keys are built only through `storage/keys.ts` |
| `audiobook-storage` | zod validation on read; an invalid value is logged and treated as missing |
| `pdf-import-pipeline` | Parsing stays in the WebView; `features/import` orchestrates, it doesn't parse |
| `tts-playback-engine` | One sentence per utterance and a generation token; progress writes don't originate in components |

## Conflicts to report (the skill wins, per PROMPT §1)

1. **Location of UI primitives.** The `modular-architecture` examples use `src/components/ui`, while PROMPT uses `src/shared/ui`. The skill's layer diagram, however, puts "ui primitives" right in `shared`, so the underlying rule is respected. **Proposed decision:** `src/shared/ui`, with the reuse search rule (skill §6) applied to `src/shared`.
2. **Location of repositories.** The skill puts them in `features/<f>/repository/`, while PROMPT and `audiobook-storage` centralize them in `src/repositories/`, because `progress` and `settings` are used by several features. **Proposed decision:** `src/repositories/`, since the storage skill is more specific. Features see only the interfaces, via `app/dependencies.ts`.
3. **Location of zod schemas.** `audiobook-storage` wants them in each feature's `model/schemas.ts`, but repositories in the lower layer may not import from features. **Proposed decision:** persistence schemas live in `src/shared/domain/schemas/`, and each feature re-exports them from `model/schemas.ts`.
4. **The `screens` layer.** The skill has a `screens` layer, while navigation lives in `src/app/navigation`. **Proposed decision:** the navigators in `src/app/navigation` only register the screens exported from `features/<f>/index.ts`; screens stay in `features/<f>/screens`.

> The four decisions must be confirmed before M0.

---

## M0 – Foundation and tooling  *(PROMPT step 1)* — ✅ done 2026-11-19

Results, deviations and pitfalls are in `.claude/plans/M0-fundatie.md` and in `CLAUDE.md`.

**Goal:** a React Native CLI project that starts on the emulator, with all quality infrastructure active. Details: `.claude/plans/M0-fundatie.md`.

- `@react-native-community/cli init` (RN 0.88), TypeScript `strict`, New Architecture; `android/` and `ios/` in the repo.
- React Navigation: RootStack (Tabs, Import modal, Book) + Tabs (Library, Player, Settings), with typed `ParamList`s.
- Inter and Space Grotesk fonts as natively linked `.ttf`; `react-native-bootsplash` held until loading finishes.
- ESLint (`@react-native/eslint-config` + `typescript-eslint`), Prettier and `eslint-plugin-boundaries` with the layer rules from skill §3. Ban on AsyncStorage/FS outside `storage/` and `repositories/`, and on any `expo*` import.
- ESLint rules for limits: `max-lines`, `max-params`, `complexity`, `max-depth`.
- Jest (`react-native` preset) and `@testing-library/react-native`; the `typecheck`, `lint` and `test` scripts.
- Direct native settings: `AsyncStorage_db_size_in_MB` in `android/gradle.properties` and `UIBackgroundModes: ["audio"]` in `Info.plist`.
- `i18next` with `ro.json` and `I18nProvider`.
- **`.claude/scripts/run-android.ps1`**, adapted from `techspeak` (also RN CLI, so small changes): project at the root, the ABook package, `npm` instead of `yarn`.

**Done when:** the app opens on the emulator via the script, with 3 empty tabs and the fonts loaded, and local CI is green.

## M1 – Design system  *(step 2)* — ✅ done 2026-11-19

Results, deviations and pitfalls are in `.claude/plans/M1-design-system.md` and in `CLAUDE.md`. Visual catalog: `abook://dev/ui` (debug build only).

**Goal:** all primitives, built on tokens and tested, before any screen. Details: `.claude/plans/M1-design-system.md`.

- `shared/theme`: tokens (colors, `space`, `radius`, `type`) from PROMPT §7, plus `ThemeProvider` and `useTheme`.
- `shared/ui`: `Button` (primary/secondary/ghost/danger), `IconButton`, `Chip`, `ChipGroup`, `Card`, `ProgressBar`, `Switch`, `ListRow`, `Slider`, `BookCover` (deterministic color from id), `BottomTabBar`, `ScreenHeader`, `EmptyState`.
- `shared/utils`: formatting of sizes, durations and percentages, in separate files by purpose.
- Accessibility in every primitive's contract: role, state, label, targets ≥ 44 pt, font scaling capped at 1.4× in headers.

**Tests:** render, interaction and accessibility state for each primitive; a test that tokens have contrast ≥ 4.5:1.
**Done when:** every primitive in the list exists and is tested, and the real tab bar replaces the default one.

## M2 – Data and storage  *(step 3, `audiobook-storage` skill)*

Details: `.claude/plans/M2-storage.md`.

- `shared/domain`: `BookId`, `PageNumber`, `SentenceIndex` and the zod schemas for `BookMeta`, `Chapter`, `ChapterChunk`, `Progress`, `Bookmark`, `Settings`.
- `storage/keys.ts`, `keyValueStore.ts` (AsyncStorage 3.x `getMany`/`setMany`/`removeMany`/`getAllKeys`, `abk:` namespacing), `fileStore.ts` (over `@dr.pogodin/react-native-fs`).
- `storage/migrations/` (`001-initial.ts`) and the migration runner.
- `repositories/`: `BookRepository`, `ProgressRepository`, `SettingsRepository`, each as interface + `Local*` implementation. They include splitting chapters over 256 KB into `ch:{n}:p:{k}` and deletion by prefix.
- `app/dependencies.ts`, `app/bootstrap.ts` (migrations, then `getAllKeys` + a single `getMany` for `books` + every `meta` + `settings`, then marking books left `processing`) and `StoreProvider` with RTK.

**Tests:** with in-memory `KeyValueStore` and `FileStore`: write order on import, resume after crash, deletion without orphan keys, corrupt values, oversized chapters, each migration.
**Done when:** bootstrap hydrates the store from a fake storage in tests and from a real one on the emulator.

## M3 – Text and PDF import  *(steps 4–5, `pdf-import-pipeline` skill)*

**M3a – `services/text`** (pure functions, one per file): `stripRepeatedHeaders`, `stripPageNumbers`, `joinHyphenatedWords`, `normalizeDiacritics`, `segmentSentences`, `splitLongSentence`, `detectChapters`.
**Tests:** table-driven with Romanian samples: dialogue, abbreviations, hyphens, cedillas, sentences > 400 characters, empty text. Target: 100% coverage.

**M3b – `services/pdf`**
- `PdfTextExtractor` (interface) and `WebViewPdfExtractor`.
- `services/pdf/webview/`: HTML + legacy `pdfjs-dist` with the worker inlined, as a local asset.
- The `{ type, requestId, payload }` protocol, zod-validated on both sides, with base64 in 512 KB chunks, batches of 5 pages, timeout and cancellation.
- `PdfExtractorHost`, mounted once and hidden, with no network access.

**M3c – `features/import`**
- State machine `idle | copying | opening | extracting | saving | ready | failed | cancelled`.
- Picker with a 100 MB limit, fingerprint for duplicates (`@noble/hashes`), resume from `processedPages`.
- Edge cases: scanned PDF, password-protected, corrupt, cancellation.
- Import screen: file card, steps with status, title/author/language form.
- The book becomes playable after the first chapter.

**Tests:** the state machine with a fake `PdfTextExtractor`, for every failure case.
**Done when:** a real 300+ page PDF imports on the emulator without the UI freezing.

## M4 – Library and book details  *(steps 6–7)*

- `features/library`: `FlashList` list, search, chips Toate / În curs / Terminate (All / In progress / Finished), "Continuă ascultarea" (Continue listening) card, "Importă PDF" FAB. States: skeleton, empty (the separate "Bibliotecă goală" / empty library screen), no results, book being processed with an import bar.
- `features/book`: large cover, metadata chips, "Continuă de la pagina N" (Continue from page N), table of contents with per-chapter status, bookmarks, deletion with confirmation. States: book being processed, failed book (retry). Exposes the public selectors used by the player.

**Tests:** slices, memoized selectors and every state from the screens table.
**Done when:** after a book is deleted, it leaves no keys or files on the device.

## M5 – Voice and player  *(step 8, `tts-playback-engine` skill)*

- `services/tts`: `TtsEngine`, `NativeTtsEngine` (over the custom `AbookTts` TurboModule, with a Codegen spec in `specs/NativeAbookTts.ts`) and `FakeTtsEngine` for tests.
- `features/player`:
  - the playback session with states `idle | loading | playing | paused | ended | error`;
  - generation token; LRU cache with at most 3 chapters and prefetch at 80% of the chapter;
  - pause (going back one sentence after 5 minutes); speeds 0.75–2.0; sleep timer; remaining time (moving average over 20 sentences); retry on error; voice fallback;
  - progress throttled to 3 s, with flush on pause, on chapter change and on going to background.
- Hooks: `usePlaybackSession`, `useActiveSentence`, `useSleepTimer`, `useRemainingTime`, `useAutoScroll`.
- UI: text by paragraph in a `FlashList` with `React.memo`, Reanimated highlight in 150 ms, auto-scroll + "Înapoi la fraza curentă" (Back to current sentence), tap/long press, page slider, controls with a 76 pt play button.
- The mini-player above the tab bar, on Library and Settings.

**Tests:** with `FakeTtsEngine` and fake timers: the sentence chain, moving to the next chapter, end of book, rapid presses, speed change, sleep, error and voice fallback.
**Done when:** after the app is killed, playback resumes at the same sentence.

## M6 – Settings, storage and backup  *(step 9)*

- `features/settings`: voice select, speed and pitch sliders, "Ascultă o mostră" (Play a sample), toggles (highlight, headers, background), text size, with a 500 ms debounce.
- Storage section: PDF bar (from FS) vs AsyncStorage (estimate), deleting the extracted text.
- Backup: JSON export `{ schemaVersion, exportedAt, entries }` via `react-native-share`; import with full validation and migration before a single `multiSet`.
- The "no Romanian voice installed" state, with instructions.

**Tests:** backup round-trip, invalid backup rejected without any write, debounce.
**Done when:** a backup re-imported on a clean install restores the library and progress.

## M7 – Performance, accessibility and polish  *(step 10)*

- Measurements in a release build on a mid-range Android: startup < 1.5 s, 60 fps while scrolling, JS thread free during import, memory (at most 3 chapters, PDF never fully in JS).
- Checks with TalkBack/VoiceOver, contrast, enlarged font.
- Background playback on iOS on a real device; the `AbookTts` TurboModule configures the audio session for background playback.
- Comparison with the mockups, for all 6 screens and all states.
- Ticking the PROMPT *Definition of done* (final section).

---

## Risks and things to check early

| Risk | When it's checked | Plan B |
| --- | --- | --- |
| Legacy pdf.js + locally inlined worker in a WebView on Android | spike at the start of M3b | separate worker build, loaded as a blob |
| AsyncStorage limit on Android | **Solved in M0:** v3.1.1 uses Room/SQLite, without the 6 MB limit | we keep values under ~256 KB (the 2 MB `CursorWindow` read limit) |
| `react-native-tts` | **Confirmed in M0:** doesn't compile with Gradle 9 (`jcenter()`), so it was removed | **M5: custom TurboModule** `AbookTts` (Android `TextToSpeech`, iOS `AVSpeechSynthesizer`) behind `TtsEngine` |
| Playback with the screen locked (iOS) | M5/M7, on a device | `AVAudioSession` with the `playback` category in the TurboModule |
| pdf.js as a local asset in RN CLI (no Expo asset bundler) | spike at the start of M3b | HTML in `android/app/src/main/assets` + iOS bundle, or inline HTML generated at build time |
| Missing `ro-RO` voices on the emulator | M5 | testing with `en-US` + the "no voice" state |
| Mockups: 5 of 6 screens are in `.claude/design/` (the Library with books is missing) | before M4 | ask for the missing mockup or derive it from existing components (card, `ProgressBar`, `BookCover`) |
| Native `Slider` (`@react-native-community/slider`): on Android the node is ≈ 18 dp tall (below the 44 pt target), and the empty track is barely visible | **Found in M1** (emulator); to be solved in M6 | custom slider with Gesture Handler + Reanimated, with the same API as `shared/ui/Slider` |
| Tab labels in the mockups: Bibliotecă / **Ascultă** / Setări (not "Player") | M0 (`ro.json`) | — |
