# M2 – Data and storage

Branch: `m2-storage`. References: `PLAN.md` (M2), `PROMPT.md` §3 (architecture) and §4 (data model and storage), the `audiobook-storage` skill (`.claude/skills/`), the `modular-architecture` skill §3, §4, §8–§10.

## Goal

The whole persistence layer, tested against in-memory fakes: domain types with zod schemas, the `KeyValueStore` and `FileStore` adapters, migrations, the three repositories (with chapter splitting and deletion by prefix), `bootstrap.ts` and the Redux store hydrated before the splash is hidden. No import, player or settings UI yet; those are M3–M6, and they only consume what M2 exposes.

## Corrections to `PLAN.md` (reported, fixed in the plan commit)

1. **`fileStore.ts` "(the `File`/`Directory` API)"** is the `expo-file-system` API, left over from before the RN CLI decision. The adapter wraps `@dr.pogodin/react-native-fs` (`copyFile`, `exists`, `stat`, `mkdir`, `unlink`, `DocumentDirectoryPath`).
2. **`multiGet/multiSet/multiRemove`** → AsyncStorage 3.x `getMany` (returns `Record<string, string | null>`), `setMany(Record<string, string>)`, `removeMany`, `getAllKeys`. The interface keeps the v3 names.
3. **"A single `multiGet` for `books` + `meta` + `settings`"** can't be done literally: the `meta` keys depend on the ids in `books`. Decision: `getAllKeys()` (cheap, keys only) → one `getMany` with `abk:books`, `abk:settings` and every `abk:book:*:meta`. The key list also reveals orphan keys for free.

## Decisions (assumptions; I report them if they change)

- **Schemas** live in `src/shared/domain/schemas/` (decision 3 in `PLAN.md`); types are `z.infer`. Features will re-export them from `model/schemas.ts` when they get a `model/` folder (M3+).
- **Brands:** `BookId` (exists), `PageNumber`, `SentenceIndex`, `ChapterIndex` — branded numbers with `to*` constructors, and zod schemas that produce the brand (`z.number().int().nonnegative().brand()` or a `transform`, whichever keeps the inferred type equal to the existing `BookId`).
- **`BookMeta.coverColor`** stays a `string`, as in PROMPT, filled by the import with `pickCoverColor(id)`. `BookCover` keeps deriving the color from the id, so the field is informational (backup, future custom covers). `shared/domain` doesn't import `shared/theme` (theme already imports domain → cycle).
- **Split chapters:** when a serialized `ChapterChunk` is > 256 KB (UTF-8 bytes, not `string.length`; diacritics are 2 bytes), `ch:{n}` holds a small manifest `{ parts: k }` and the parts go into `ch:{n}:p:0…k-1`. Reading `ch:{n}` tells whether to read the parts, with one extra `getMany`, without `getAllKeys`. The schema of `ch:{n}` is `ChapterChunk | ChapterPartsManifest`. This is an extension of the skill's key table, not a deviation.
- **Validation on read:** one helper, `readJson(raw, schema, key)` in `repositories/`, that returns `T | null`; JSON or schema errors are logged with the key (`shared/utils/logger.ts`, `console.warn` only in `__DEV__`) and treated as missing.
- **Dependency injection:** `app/dependencies.ts` builds the `Local*` implementations over the real adapters. Features reach them only through RTK thunks' `extra` argument, typed with the `AppDependencies` interface from `repositories/` (type-only import, allowed by lint). No React context for repositories.
- **Store:** `src/app/store/` (`createAppStore(deps)`, `RootState`, `AppDispatch`). Slices belong to features: `features/library/state/booksSlice.ts` (entity adapter over `BookMeta` + order) and `features/settings/state/settingsSlice.ts`. Each feature exports a `*Hydrated` action from its `index.ts`, and `bootstrap` dispatches them; the store holds source data only. Progress isn't in the store at boot (loaded on demand by the player, M5).
- **Books left `processing` at boot** are marked `failed` in M2; resuming from `processedPages` comes with the pipeline in M3c, which replaces that step.
- **Throttle (progress, 3 s) and debounce (settings, 500 ms)** don't belong in repositories; they come with the hooks in M5/M6. Repositories write immediately.
- **Database:** the default `AsyncStorage` export (v3, Room). `createAsyncStorage('abook')` would isolate the DB, but the `abk:` prefix already does that and the default keeps the jest mock simple. Checked in step 3.
- **Bootstrap failure** (storage unreadable): logged, the app starts with an empty library and `DEFAULT_SETTINGS`, and the splash still hides. No error screen in M2.

## Steps

Each step ends with a green `npm run check` and a separate commit; the step's section is completed with "**Done** (date). Findings: …".

### 1. Branch, skills, plan
- `git switch -c m2-storage` from `dev`; load `modular-architecture` and `audiobook-storage`.
- This plan + the corrections in `PLAN.md` (M2 section).
- **Check:** `git log` on the branch starts from `707a120`.

### 2. Domain types and schemas (`shared/domain`)
- `ids.ts`: add `PageNumber`, `SentenceIndex`, `ChapterIndex` (branded) and their constructors.
- `schemas/`: one file per value — `bookMeta.ts` (+ `BookStatus`, `BookLanguage`), `chapter.ts`, `chapterChunk.ts` (+ `ChapterPartsManifest`), `progress.ts`, `bookmark.ts`, `settings.ts` (+ `DEFAULT_SETTINGS`, `fontScale` 0 | 1 | 2, rate 0.75–2.0, pitch range) and `index.ts`.
- Invariants in the schema, not just shapes: `processedPages ≤ pageCount`, `ChapterChunk.sentences.length === sentencePages.length`, `startPage ≤ endPage`, ISO dates.
- `shared/utils`: `utf8ByteLength.ts` (pure, no `TextEncoder` dependency in Hermes) and `logger.ts`.
- **Tests:** table-driven valid/invalid samples for every schema; `DEFAULT_SETTINGS` passes its own schema; `utf8ByteLength` with ASCII, `ăîșțâ`, emoji (surrogate pairs), empty string.

**Done** (2026-11-19). Findings:
- **Brands from zod:** `.transform(toBookId)` (and `toPageNumber`, …) instead of zod's `.brand()`. The inferred output is exactly the existing `BookId = string & { __brand }`, while `.brand()` would produce `string & z.$brand<…>`, a different type that wouldn't mix with `toBookId`. `BookId` is `z.uuid()`, so ids like `'book-1'` (used in M1's `BookCover` tests) are fine for components but rejected on read from storage.
- **Invariants in schemas:** `processedPages ≤ pageCount` (with `pageCount: 0` allowed while `processing`), `startPage ≤ endPage`, `sentences` / `sentencePages` of equal length, toc indexes exactly `0..n-1`, no duplicate ids in `abk:books` or in the bookmarks.
- **`ch:{n}`** is `chapterEntrySchema = ChapterChunk | { parts ≥ 2 }`, as decided above.
- **Settings:** rate 0.75–2.0, pitch 0.5–2.0, `fontScale` with `z.literal([0, 1, 2])` (zod 4 accepts an array). `DEFAULT_SETTINGS` is frozen: voice `null`, rate and pitch 1, all toggles on, `fontScale` 1.
- **`utf8ByteLength`:** a manual UTF-16 → UTF-8 count (Hermes doesn't guarantee `TextEncoder`), checked against `Buffer.byteLength` on Romanian text with cedillas, curly quotes and emoji. A lone surrogate counts as 3 bytes (U+FFFD).
- **`logger`:** `console.warn` with the `[abook]` prefix only in `__DEV__`, the only logging entry point.
- **Jest:** any file under `__tests__/` is a suite, so the raw sample values live in `shared/domain/__fixtures__/rawValues.ts`. The hex lint rule also applies to test files, so the fixture's `coverColor` is a placeholder string.

### 3. `storage/keys.ts` and `KeyValueStore`
- `keys.ts`: `NAMESPACE = 'abk:'`, `rootKey('books' | 'settings' | 'schemaVersion')`, `bookKey(id, 'meta' | 'toc' | 'progress' | 'bookmarks')`, `chapterKey(id, n, part?)`, `bookPrefix(id)`, `isMetaKey(key)` / `bookIdFromKey(key)`. The only place where keys are concatenated.
- `KeyValueStore` interface (`getMany`, `setMany`, `removeMany`, `getAllKeys`), the adapter `asyncStorageKeyValueStore.ts` (sees only `abk:*` keys in `getAllKeys`) and `InMemoryKeyValueStore` in `src/storage/testing/`, with fault injection (`failNext('setMany')`) for crash tests.
- **Tests:** a shared contract suite run against both implementations (AsyncStorage through its official jest mock); the key builders and parsers, including ids that contain `:`-free UUIDs only (a malformed id is rejected by `bookIdFromKey`).
- Lint sentinel: a key literal `'abk:...'` outside `storage/keys.ts` is reported (a `no-restricted-syntax` rule on string literals starting with `abk:`) — only if it stays cheap; otherwise noted as a review rule.

**Done** (2026-11-19). Findings:
- **AsyncStorage 3.x:** the default export is the `legacy` database (the jest mock does `createAsyncStorage('legacy')` too). It's kept as decided. `getMany` already returns every requested key, with `null` for missing ones. The adapter skips the native call for empty batches.
- **Namespace guard:** `assertNamespaced` (in `keys.ts`) throws on any key outside `abk:` in `getMany` / `setMany` / `removeMany`, in both the adapter and the fake, and `getAllKeys` hides foreign keys. A typo in a key fails loudly instead of writing next to the data.
- **Keys:** besides the planned helpers, `chapterPartsPrefix(id, n)` ends with `:p:`, so the parts of chapter 1 never match chapter 10. `bookIdFromKey` validates the id with `bookIdSchema`, so a malformed id gives `null`.
- **Fake:** `InMemoryKeyValueStore` in `src/storage/testing/` records every call (`calls`, for write order and batch counts), offers `failNext(op)` (the call is recorded, then rejects before any change) and `snapshot()`. The constructor accepts foreign keys, to simulate other data in the same database.
- **Contract:** one suite with `describe.each` over the fake and the adapter (on the package's official jest mock, `@react-native-async-storage/async-storage/jest`, with `clearAllMockStorages`). Both behave identically.
- **Lint:** the key rule was cheap, so it's in. Both the hex rule and the key rule use `no-restricted-syntax`, and in flat config a later block **replaces** the rule's options for the files it matches, so a naive second block would have switched the hex rule off. There are three blocks now: `src` (hex + keys), `shared/theme` (keys only), `storage/keys.ts` (hex only). The selectors catch both string literals and template literals that start with `abk:`. Two new sentinels prove it, including that the hex rule still applies in `keys.ts`. Tests are exempt, so they may assert literal keys.

### 4. `FileStore`
- Interface: `ensureDir(path)`, `copy(from, to)`, `exists(path)`, `size(path)`, `remove(path)` (idempotent), `booksDir()`, `bookPdfPath(id)`. M3 adds base64 chunk reading for the extractor.
- `reactNativeFsFileStore.ts` over `@dr.pogodin/react-native-fs`; `InMemoryFileStore` in `storage/testing/`.
- Mock of `@dr.pogodin/react-native-fs` in `jest.setup.js`, if the package has none.
- **Tests:** the same contract suite on the fake and on the adapter (with the mock); removing a missing file doesn't throw; `bookPdfPath` lands in `DocumentDirectoryPath/books/{id}.pdf`.

**Done** (2026-11-19). Findings:
- **No mock in the package**, and importing `@dr.pogodin/react-native-fs` calls `RNFS.getConstants()` on the native module at load time, so any test that imports the adapter (and, in step 10, `App` through `dependencies.ts`) would crash. `jest.setup.js` now has an in-memory mock with the native semantics the app relies on: `unlink` and `stat` reject on a missing path, `unlink` deletes a directory recursively, `copyFile` needs an existing source and parent directory, `mkdir` creates the parents. Files are stored as sizes only. Tests seed it with `__writeFile` and clear it with `__reset` (`jest.requireMock`).
- **Interface:** besides the planned methods, `list(dir)` (entry names, `[]` for a missing directory) for the orphan-file sweep in step 9. `size` returns `null` for a missing file instead of rejecting, and `remove` checks `exists` first, because the native `unlink` rejects. Paths are absolute, without `file://`.
- **Adapter:** `createReactNativeFsFileStore(fs = RNFS)` takes the narrow `FsApi` subset (`Pick<typeof RNFS, …>`), so it can be injected. `copy` doesn't create the parent: the repository calls `ensureDir(booksDir())` explicitly, and the contract proves a copy into a missing directory rejects.
- **Fake:** `InMemoryFileStore` (sizes in a map) records the writes (`ensureDir`, `copy`, `remove`) for write-order checks next to the key-value fake, and offers `failNext`, `addFile` (the picked PDF) and `filePaths()`. It duplicates the jest mock's logic in TypeScript; they serve different purposes (typed test double vs. module mock), so I kept both.
- **For M3:** on Android, the picker returns `content://` URIs. Whether `copyFile` reads them directly, or the picker's `keepLocalCopy` is needed first, is checked on the emulator in M3c.

### 5. Migrations
- `storage/migrations/types.ts` (`Migration = { version: number; migrate: (entries: Entries) => Entries }`), `001-initial.ts` (0 → 1: nothing to transform, establishes the version), `index.ts` (ordered list), `runMigrations(kv, migrations)`.
- The runner reads `abk:schemaVersion`; with nothing pending it touches nothing else. Otherwise: `getAllKeys` + `getMany` of all `abk:*`, applies the pure migrations in order, writes only the diff (`setMany` for changed, `removeMany` for removed) and `schemaVersion` last, so a crash means re-running from the old version.
- A stored version newer than the app knows (downgrade): logged, no writes.
- **Tests:** empty store → version 1; already current → zero writes; two fake migrations applied in order; a crash before the version write → re-run produces the same result; downgrade; each real migration has its own test.

### 6. Read/write helpers and chapter splitting (`repositories/`)
- `readJson.ts` (validate + log + `null`), `serialize.ts`.
- `chapterChunking.ts`: `splitChapterChunk(chunk, maxBytes)` → parts that keep `sentences` and `sentencePages` aligned; `joinChapterParts(parts)`. Pure, ≤ 40 lines per function. A single sentence over the limit is a programming error (M3 caps sentences at ~400 characters) and throws.
- **Tests:** a chunk under the limit stays one part; 1 MB of Romanian text → parts each < 256 KB that join back identically; part boundaries never split a sentence; the oversized-sentence case.

### 7. `BookRepository` + `LocalBookRepository`
- Interface in `repositories/BookRepository.ts`; implementation in `LocalBookRepository.ts` (over `KeyValueStore` + `FileStore`), split into units if it grows past 200 lines (`deleteBook.ts`, `chapterStore.ts`).
- Operations in import order: `storePdf(id, sourceUri)` → `createBook(meta)` (`meta` `processing` + append to `books`) → `saveChapter(id, n, chunk)` (split when needed) → `saveToc(id, chapters)` → `updateMeta(id, patch)` (`ready`, `processedPages`, `failed`). Reading: `listBooks()`, `getMeta`, `getToc`, `getChapter(id, n)` (whole or from parts).
- `deleteBook(id)`: remove from `books`, `removeMany` on every key with `bookPrefix(id)` (from `getAllKeys`), then the file.
- **Tests (fakes):** the write order in the fake's log; resume after a crash between chunks (`meta` stays `processing`, written chunks are readable); deletion leaves zero `abk:book:{id}:*` keys and no file; an oversized chapter round-trips; corrupt `meta` / `toc` / chunk → `null` + log, no throw; a chapter rewritten smaller removes its stale parts.

### 8. `ProgressRepository` and `SettingsRepository`
- `ProgressRepository`: `getProgress(id)`, `saveProgress(id, progress)`, `getBookmarks(id)`, `saveBookmarks(id, bookmarks)`.
- `SettingsRepository`: `getSettings()` (missing or invalid → `DEFAULT_SETTINGS`; a partially valid value keeps the valid fields over the defaults), `saveSettings(settings)`.
- `AppDependencies` interface in `repositories/index.ts` (`bookRepository`, `progressRepository`, `settingsRepository`).
- **Tests:** round-trip, missing, corrupt, partial settings.

### 9. Boot snapshot and `bootstrap.ts`
- `repositories/loadBootSnapshot.ts`: `getAllKeys` → one `getMany` (`books`, `settings`, every `meta`) → `{ books: BookMeta[]; settings: Settings }` in library order. Ids listed without valid `meta` are dropped from the order (logged); `meta` keys not listed are left for the orphan sweep.
- `app/bootstrap.ts`: `runMigrations` → `loadBootSnapshot` → mark `processing` books `failed` (one `setMany`) → sweep orphans (keys of ids that are neither listed nor have `meta`, plus their files) → return the snapshot. Each stage is a separate function; failure policy as in Decisions.
- **Tests (fakes):** empty install; a library with 3 books keeps its order; `processing` → `failed`; orphan keys from a crash during deletion are removed; a corrupt `meta` doesn't block the other books; the exact number of `getMany` calls is 1 after migrations (spy on the fake).

### 10. Store, `dependencies.ts`, `StoreProvider` and splash
- `features/library/state/`: `booksSlice.ts` (`createEntityAdapter`, `libraryHydrated`, `bookUpdated`, `bookRemoved`) and `selectors.ts` (memoized `selectBooksInOrder`, `selectBookById`), exported through `index.ts`.
- `features/settings/state/`: `settingsSlice.ts` (`settingsHydrated`), `selectors.ts`.
- `app/store/`: `createAppStore(deps)` with `thunk.extraArgument = deps`, `RootState`, `AppDispatch`; `app/dependencies.ts` (the only `new Local*`); `app/providers/StoreProvider.tsx`.
- `App.tsx`: `useBootstrap` (hook, ≤ 80 lines) runs `bootstrap` once, dispatches the hydration actions, and the navigator renders only afterwards; `BootSplash.hide` waits for both bootstrap and `onReady`.
- **Tests:** reducer and selector tests for both slices; `App` with fake dependencies: the splash isn't hidden before hydration, the store contains the fake's books after it, and a throwing bootstrap still hides the splash with an empty library.

### 11. Dev storage screen and emulator check
- `src/app/dev/StorageDebugScreen.tsx` (`__DEV__` only, `abook://dev/storage`, like the UI catalog): `schemaVersion`, the number of `abk:*` keys and the books from the store, plus "Seed sample book" (a `processing` book with an oversized chapter, through `BookRepository`), "Delete all" and "Reload" buttons.
- **Check on the emulator:** seed → kill the app (`adb shell am force-stop`) → relaunch: the book is there and `failed`; the chapter reads back whole; delete → relaunch: 0 `abk:book:*` keys and no file in `books/` (`adb shell run-as <package> ls files/books`).

### 12. Closing
- `modular-architecture` §10 checklist, the summary (new / reused units / `arch-exception`), `PLAN.md` (M2 ✅) and `CLAUDE.md` (M2 pitfalls).

## Definition of done – M2

- [ ] Every value in the key table has a zod schema; every read goes through `readJson`.
- [ ] Keys are built only in `storage/keys.ts`; AsyncStorage and RNFS are imported only in `storage/` (lint).
- [ ] The import write order, resume after a crash, deletion without orphans, corrupt values, oversized chapters and each migration are covered by tests against the fakes.
- [ ] `bootstrap` hydrates the store with one `getMany` after migrations; the splash waits for it.
- [ ] The same flow verified on the emulator, with real storage, across an app kill.
- [ ] `npm run check` green; one commit per step.
