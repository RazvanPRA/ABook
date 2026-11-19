# ABook – Audiobook PDF

A React Native app (strict TypeScript) that imports a PDF from the phone, extracts its text locally and reads it aloud with the system TTS, sentence by sentence. **Frontend only, fully offline, UI in Romanian.**

## Sources of truth (read them before writing code)

| File                      | Contents                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------- |
| `.claude/PROMPT.md`       | full requirements: stack, architecture, data model, PDF import, player, screens, tokens |
| `.claude/PLAN.md`         | milestones M0–M7, decisions taken, risks                                                |
| `.claude/plans/M<N>-*.md` | the steps of each milestone and what was found at each step                             |
| `.claude/design/*.png`    | screen mockups (the Library with books is missing)                                      |

## Mandatory rules

- **React Native CLI, no Expo.** No `expo*` package; ESLint blocks them. Native code (`android/`, `ios/`) is edited directly, not through config plugins.
- **The `modular-architecture` skill applies to every change** (size limits, layers, feature modules, tests, definition of done). When the prompt conflicts with the skill, the skill wins and the conflict is reported.
- **Load the matching skill before writing code:** `audiobook-storage` (persistence), `pdf-import-pipeline` (import), `tts-playback-engine` (player). Use the copies in `.claude/skills/`, aligned with RN CLI. The account copies (`anthropic-skills:*`) still mention Expo.
- **Every step ends with a green `npm run check`** and a separate commit. The step's plan is updated with what was found.

## Commands

```bash
npm run check          # typecheck + lint + prettier --check + jest (must be green)
npm test               # Jest only
npm run emu            # emulator + Metro + build only on native changes + launch app
npm run emu -- -SkipBuild | -EmulatorOnly | -ForceBuild | -ResetCache
npm run emu:rebuild    # forced build + cleared Metro cache
npx react-native-asset # after adding a font to assets/fonts
npm run pdf:webview    # regenerate the PDF WebView page (also on postinstall and in check)
```

The PDF WebView page (`src/services/pdf/webview/generated/`, 2.4 MB, gitignored) is generated from `src/services/pdf/webview/page` + `pdfjs-dist` by `scripts/build-pdf-webview.js`. Metro, tsc and Jest need it; a test fails when it is stale.

**Sample PDFs** for manual testing live outside the repo, in `C:\ModDeInvatare\Book-PDF`: Romanian notes (3 p.), _The Clean Coder_ (244 p.) and _Microservices Patterns_ (522 p., the real 300+ page PDF). What each one exercises is in `.claude/plans/M3-import.md` → "Sample PDFs". Push one with `MSYS_NO_PATHCONV=1 adb push "C:/ModDeInvatare/Book-PDF/<file>" /sdcard/Download/`. Never copy them, or text from them, into the repo: two are copyrighted and one carries personal data in a watermark.

`npm run emu` runs `.claude/scripts/run-android.ps1`. Logs are in `android/build/run-android/`. Exit codes: 1 SDK/AVD/JDK, 2 emulator died, 3 boot timeout, 4 Metro, 5 build, 6 app not in foreground.

## Structure and layers

```
src/app/           navigation/ (RootStack + Tabs, abook:// linking), providers/, App.tsx
src/features/<f>/  library, import, book, player, settings; only index.ts is public
src/services/      pdf, text, tts (no Redux, no UI)
src/repositories/  interfaces + Local* implementations; the only ones, with storage/, that touch storage
src/storage/       AsyncStorage / react-native-fs adapters, keys, migrations
src/shared/        ui (primitives), theme (tokens), i18n (ro.json), domain (BookId…), utils
```

Dependencies only point downward: `app → features → services → repositories → storage`, and `shared` is available to everyone. `eslint-plugin-boundaries` enforces:

- between features, imports go only through `index.ts`;
- features import only types from `repositories`;
- circular imports are forbidden.

The tests in `__tests__/lint/` prove the rules are active. If you change `eslint.config.js`, update those tests too.

Other rules enforced by lint: no hex colors outside `src/shared/theme`, AsyncStorage and FS only in `src/storage` and `src/repositories`, no `any` and no `!`.

Branches: `main` ← `dev` ← `m<N>-<name>` (for example `m0-fundatie`, `m0-schelet-rn`). Push and PR only on request.

## Pitfalls found in M0 (don't rediscover them)

- **JDK:** RN 0.88 accepts JDK 17–20, and `JAVA_HOME` on this PC is 25. The script picks JDK 17 for the build only. For manual Gradle: `$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"` and `.\gradlew.bat` (with `.\`).
- **TTS:** `react-native-tts` doesn't compile with Gradle 9 (`jcenter()`). The voice will be a custom TurboModule, `AbookTts`, in M5.
- **AsyncStorage 3.x:** uses Room/SQLite and the `getMany` / `setMany` / `removeMany` API (not `multiGet`). It has no `AsyncStorage_db_size_in_MB`. Values stay under ~256 KB, because the `CursorWindow` read limit is 2 MB.
- **Testing Library v14:** `render`, `renderHook` and `fireEvent.*` are async, so they are used with `await`. The tabs (custom `BottomTabBar`, since M1) have the `tab` role and the `selected` state.
- **ESLint 9:** the `ft-flow` plugin from the RN config is removed, because it hangs. `import/no-cycle` works with `disableScc: true`. In Jest, ESLint gets its config via `overrideConfig`, because ESLint 9 loads it through dynamic `import()`, which Jest doesn't support.
- **ESM packages in Jest:** add them to `ESM_PACKAGES` in `jest.config.js`. Native mocks live in `jest.setup.js`.
- **Node types:** app code doesn't see them. Tests that use `fs`/`path` start with `/// <reference types="node" />` and `@jest-environment node`.
- **Fonts:** files carry the PostScript name (`Inter-Regular`, `SpaceGrotesk-Bold`…), so `fontFamily` is the same on both platforms. Space Grotesk has no static SemiBold. A new font requires `npx react-native-asset`, and `__tests__/fonts` checks the linking.
- **Splash:** regenerate with `npx react-native-bootsplash generate assets/brand/splash-logo.svg --platforms=android,ios --background=111316 --logo-width=96`. The generator rewrites `AndroidManifest.xml`; afterwards check the comments and the `abook://` intent-filter.
- **Android manifest:** `INTERNET` exists only in `src/debug`, and `src/release` removes the network permissions. `__tests__/native` guards the rule.
- **Committing from PowerShell 5.1:** messages with double quotes break inside a here-string. Write the message to a file and use `git commit -F <file>`. Write the file with the Write tool, not with `Set-Content`, which puts a BOM in the message.

## Pitfalls found in M1

- **Line endings:** `core.autocrlf=true` in the global Git config rewrote the working copy with CRLF on every `git switch`, and `prettier --check` failed on the whole repo. `.gitattributes` now has `* text=auto eol=lf`; don't remove `eol=lf`.
- **Reanimated 4.7 in Jest:** the official mock (`react-native-reanimated/mock`) crashes on import, because `setCSSEventHandler` throws in JSReanimated. `jest.setup.js` has a minimal manual mock; extend it when you use a new Reanimated API.
- **Lucide in Jest:** Jest resolves `lucide-react-native` to the `.mjs` build, which the RN transform skips. `moduleNameMapper` points it to `dist/cjs`. In Lucide 1.75, `MoreHorizontal` is called `Ellipsis`.
- **`StatusBar` in RN 0.88:** no longer has `backgroundColor` (edge-to-edge). The background comes from the root view, with `color.bg`.
- **Group roles:** a `radiogroup` or `tablist` container stays non-accessible (otherwise TalkBack swallows the children), so `getByRole('radiogroup')` doesn't find it. Look it up by label and check `props.accessibilityRole`.
- **The `local/max-props` rule** (≤ 7, in `eslint-rules/max-props.js`): counts the own members of `*Props` types and the destructured properties of PascalCase components. Group related props into an object (e.g. `Slider.range`, `ScreenHeader.back`).
- **Primitives don't know i18n:** they receive already-translated texts, including accessibility labels (e.g. `BookCover.accessibilityLabel`). The units for `formatBytes` / `formatDuration` come from `ro.json` → `format.*`, as a parameter.
- **UI catalog:** `abook://dev/ui` (`__DEV__` only), with all primitives. To check accessibility on the emulator: `adb shell uiautomator dump /sdcard/ui.xml` (labels, `checked`, `selected`, `enabled`, sizes).
- **Screenshots from PowerShell:** `adb exec-out screencap -p > f.png` corrupts the PNG (encoding). Use `adb shell screencap -p /sdcard/x.png` + `adb pull`.
- **`npm run check` with the emulator and Metro running** is much slower (`eslint .` ~90 s); run it in the background, with output to a file, not through a buffering pipe.

## Pitfalls found in M2

- **Storage access:** only through repositories (`src/repositories/{book,progress,settings,boot}`), built in `app/dependencies.ts`. Features get `AppDependencies` as the RTK thunk `extra`, never an implementation. Keys come only from `storage/keys.ts`: lint rejects `'abk:…'` / `` `abk:…` `` literals elsewhere in code.
- **Two lint rules share `no-restricted-syntax`** (hex colors and storage keys). In flat config a later block **replaces** the rule's options for the files it matches, so `eslint.config.js` has one block per file group with exactly the selectors that apply. Don't add a third block for the same rule without merging.
- **Fakes for storage tests:** `src/storage/testing` (`InMemoryKeyValueStore`, `InMemoryFileStore`): call log for write order, `failNext(op, { skip })` to crash on the n-th call. Domain samples (`BOOK_IDS`, `makeMeta`) live in `shared/domain/__fixtures__`, so feature tests may use them (`boundaries` forbids value imports from `repositories/` in features, tests included). Files under `__tests__/` are always suites, so shared test data goes in `__fixtures__/`.
- **RNFS in Jest:** `@dr.pogodin/react-native-fs` reads native constants on import and ships no mock. `jest.setup.js` has an in-memory mock (`__writeFile`, `__reset` via `jest.requireMock`).
- **Redux in Jest:** `immer`, `reselect`, `redux`, `redux-thunk` and `react-redux` are in `ESM_PACKAGES`, because Jest resolves them to their ESM builds.
- **zod in Metro:** zod 4's ESM build uses `export * as x from`, so `babel.config.js` needs `@babel/plugin-transform-export-namespace-from` (before the worklets plugin, which stays last). Jest loads zod's CJS build and **doesn't** catch this: a new dependency in the bundle must be checked on the emulator. After any Babel change, run `npm run emu -- -SkipBuild -ResetCache`. The first `npm run check` after it can fail with `EPERM` on the Jest transform cache (parallel workers on Windows); rerun it.
- **`crypto.getRandomValues`:** Hermes lacks it, so `react-native-get-random-values` is the first import in `index.js` (needed by `uuid`).
- **Boot:** `useBootstrap` runs migrations → one `getMany` snapshot → order repair → interrupted imports `failed` → orphan sweep, and the navigator mounts only after it (so `BootSplash.hide` waits). A deep link that arrives **during** bootstrap is lost (a cold start with the link works); see the risk in `PLAN.md`.
- **Storage inspector:** `abook://dev/storage` (`__DEV__` only): real keys and files next to the store, seed and delete all. To seed a PDF too: `adb shell run-as com.abook sh -c 'head -c 50000 /dev/urandom > files/seed.pdf'`. App files: `adb shell run-as com.abook ls files/books`.
- **adb from Git Bash:** prefix with `MSYS_NO_PATHCONV=1`, otherwise `/sdcard/…` becomes `C:/Program Files/Git/sdcard/…`. If `npm run emu` exits with 6 because another app is in the foreground, close that app and rerun the script.
