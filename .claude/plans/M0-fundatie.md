# M0 – Foundation and tooling (React Native CLI)

Branch: `m0-fundatie` (from `dev`). At the end: PR `m0-fundatie` → `dev`.
References: `.claude/PLAN.md` (M0), `.claude/PROMPT.md` §2, §3 and §8 step 1, the `modular-architecture` skill §2, §3 and §10.

**Platform: pure React Native CLI. No Expo**: no SDK, no `expo-*` packages, no `install-expo-modules`. Lint forbids any `expo*` import.

## Goal

A React Native CLI project that starts on the `Pixel_10_Pro_XL` emulator via `.claude/scripts/run-android.ps1`. It has 3 empty tabs and the fonts loaded, and `typecheck`, `lint` and `test` are green. The architecture rules are already enforced by lint, before any business code exists.

## Verified environment (2026-11-18)

| Tool | Version | Note |
| --- | --- | --- |
| Node / npm | 24.13.0 / 11.6.2 | ok |
| React Native | 0.88.1 (`@react-native-community/cli` 21.0.0) | latest stable |
| Android SDK | `%LOCALAPPDATA%\Android\Sdk` | AVD `Pixel_10_Pro_XL` |
| JDK | `JAVA_HOME` = 25; 17 (Adoptium) is also installed | Check which JDK RN 0.88 requires (step 2). If it's 17, the script sets `JAVA_HOME` for the build only |

## Expo → RN CLI equivalents (applied in PROMPT §2)

| Need | Before (Expo) | Now (RN CLI) | Version |
| --- | --- | --- | --- |
| Navigation | `expo-router` | `@react-navigation/native` + `native-stack` + `bottom-tabs` | 7.5 / 7.21 / 7.22 |
| Files | `expo-file-system` | `@dr.pogodin/react-native-fs` | 2.41 |
| PDF picking | `expo-document-picker` | `@react-native-documents/picker` | 12.1 |
| Voice | `expo-speech` | `react-native-tts` (fallback: custom TurboModule) | 4.1.1 |
| UUID / hash | `expo-crypto` | `react-native-get-random-values` + `uuid`, `@noble/hashes` | 2.1 / – / 2.4 |
| Sharing | `expo-sharing` | `react-native-share` | 12.3 |
| Splash | `expo-splash-screen` | `react-native-bootsplash` | 7.3 |
| Fonts | `expo-font` + `@expo-google-fonts/*` | `.ttf` in `assets/fonts`, linked with `react-native-asset` | – |
| Native config | config plugins | direct changes in `android/` and `ios/` | – |
| Tests | `jest-expo` | Jest with the `react-native` preset | – |

## Assumptions (to be confirmed; they don't block the start)

- Decisions 1–4 from `PLAN.md` ("Conflicts to report") apply as proposed.
- The native project name is `ABook`, with package / bundle id `com.abook` and display name "Audiobook PDF".
- The package manager is `npm`.
- I work on Android only, on Windows. The `ios/` folder is generated and kept in the repo, but the iOS build (pod install, Xcode) can't be verified here.

---

## Steps

Each step ends with a commit on `m0-fundatie`. From step 4 on, every commit passes `typecheck`, `lint` and `test`.

### 1. Initial commit
- Add `.claude/` (PROMPT, PLAN, plans, skills).
- **Check:** `git status` clean.

### 2. React Native CLI skeleton
**Done** (2026-11-18). Findings:
- RN 0.88.1 requires a JDK between 17 and 20 (`react-native doctor`). The script uses JDK 17 automatically.
- The template generated `com/com.abook/`; I moved the files to `com/abook/`. I set `rootProject.name` to `ABook` and the display name to "Audiobook PDF".
- TS 6 flags `baseUrl` as deprecated, so `paths` is used without it.
- `doctor` reports "Android SDK N/A", even though build-tools 37 is installed and the build passes. It's a detection bug in `doctor`.
- The debug build gets `ACCESS_LOCAL_NETWORK` from RN dev support (Android 17 asks for it at runtime). `run-android.ps1` grants it on the emulator.
- The first build took 135 s. The second run of the script doesn't build and takes 9 s.

- `npx @react-native-community/cli@latest init ABook --package-name com.abook --skip-git-init`, generated in a temporary folder (the root isn't empty), then moved to the root. `README.md` and `.claude/` stay, and `.gitignore` comes from the template.
- Check in `android/gradle.properties` that `newArchEnabled=true`, and enable it on iOS too.
- Display the name "Audiobook PDF": `android/app/src/main/res/values/strings.xml` and `CFBundleDisplayName` in `Info.plist`.
- `tsconfig.json`: `strict: true`, `noUncheckedIndexedAccess`, `noImplicitOverride`, the `@/*` → `src/*` alias, mirrored in `babel-plugin-module-resolver`.
- Check which JDK RN 0.88 requires (the "Set up your environment" docs).
- Delete the demo `App.tsx`; the entry point becomes `src/app/App.tsx`.
- **Check:** `npx tsc --noEmit` passes; `npx react-native doctor` without errors on Android.

### 3. Dependencies (all native ones, at once)
**Result** (2026-11-18):
- **`react-native-tts` spike: FAILED.** The library doesn't compile, because `build.gradle` uses `jcenter()`, which was removed in Gradle 9 (RN 0.88 uses Gradle 9.4.1). I removed it. The voice becomes a **custom TurboModule** (`AbookTts`: Android `TextToSpeech`, iOS `AVSpeechSynthesizer`) in M5, behind `TtsEngine`.
- **AsyncStorage 3.1.1:** uses Room/SQLite and has a new API (`getMany` / `setMany` / `removeMany`, `getAllKeys`, `createAsyncStorage(name)`), without `multiGet` and without the `AsyncStorage_db_size_in_MB` property, so the ~6 MB limit from v1 no longer exists. The ~256 KB per value rule remains, because of the 2 MB `CursorWindow` read limit. Step 7 no longer has anything to set for AsyncStorage.
- **`pdfjs-dist` 6.5.438:** has `legacy/build/pdf.mjs` and `pdf.worker.mjs`.
- All versions are pinned exactly in `package.json`, and `.npmrc` has `save-exact=true`.

I install all native libraries now, so the native build happens rarely and the script doesn't recompile at every milestone.

```
npm i @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs \
  react-native-screens react-native-safe-area-context react-native-gesture-handler \
  react-native-reanimated react-native-worklets react-native-svg react-native-webview \
  @react-native-async-storage/async-storage @dr.pogodin/react-native-fs \
  @react-native-documents/picker react-native-tts react-native-share react-native-bootsplash \
  react-native-get-random-values @shopify/flash-list @react-native-community/slider
npm i @reduxjs/toolkit react-redux zod i18next react-i18next lucide-react-native \
  uuid @noble/hashes pdfjs-dist
```

- For each native library, I check its docs for compatibility with RN 0.88 and the New Architecture, then pin the version. Reanimated requires the Babel plugin (for Reanimated 4: `react-native-worklets/plugin`).
- For `pdfjs-dist` I pin a version that has the legacy build (used in M3).
- No `redux-persist`, no UI kits and no `expo*` (PROMPT §2).
- **`react-native-tts` spike:** Android build, plus a manual `speak`/`stop` test from the placeholder screen. If it doesn't compile or doesn't emit events on the New Architecture, I note it in `PLAN.md` and plan the custom TurboModule for M5, without blocking M0.
- **Check:** `cd android && gradlew assembleDebug` passes.

### 4. Quality: TypeScript, ESLint, Prettier, Jest
**Done** (2026-11-19). `npm run check` (typecheck, lint, Prettier, Jest) is green, with 20/20 tests, 19 of which are lint sentinels. Deviations from the plan:
- **ESLint 9.39** with flat config (`eslint.config.js`), on top of `@react-native/eslint-config/flat`. No `typescript-eslint` package: the `@typescript-eslint` plugin is already included in the RN config, and a second one would have been a duplicate definition. The `no-explicit-any` and `no-non-null-assertion` rules are set explicitly.
- `eslint-plugin-ft-flow` (coming from the RN config) fails on ESLint 9 (`getAllComments`). We don't use Flow, so I removed its rules.
- `eslint-plugin-boundaries` 7.4 uses the `boundaries/dependencies` rule with `policies`. Between features, imports are allowed only to `index.ts` (`fileInternalPath`) or within the same feature (`captured.feature`). Towards repositories, features may only use type imports.
- `import/no-cycle` works with `disableScc: true`: the SCC optimization fails on files that don't exist on disk.
- The sentinels pass the config directly via `overrideConfig`, because ESLint 9 loads it through dynamic `import()`, unsupported by the Jest VM. The target files are created temporarily in `__lint-fixtures__` and deleted at the end.
- Node types (`@types/node`) are loaded only in the lint test (`/// <reference types="node" />`); app code doesn't see them.
- I already created the `src/` skeleton with `index.ts` files here, from step 5, so the sentinels have real targets.

- **Scripts** in `package.json`: `typecheck` (`tsc --noEmit`), `lint` (`eslint .`), `format`, `test` (`jest`), `check` (all three).
- **ESLint** (flat config: `@react-native/eslint-config` + strict `typescript-eslint` + `eslint-config-prettier`):
  - `@typescript-eslint/no-explicit-any`, `no-non-null-assertion`: `error`;
  - the limits from skill §2:

    | Glob | Rules |
    | --- | --- |
    | `**/components/**/*.tsx`, `src/shared/ui/**/*.tsx` | `max-lines` 150 |
    | `**/screens/**/*.tsx` | `max-lines` 120 |
    | `**/hooks/**/use*.ts` | `max-lines` 80 |
    | `src/services/**`, `**/services/**`, `src/shared/utils/**` | `max-lines` 200, `max-lines-per-function` 40 |
    | all files | `max-params` 3, `complexity` 10, `max-depth` 4, `react/jsx-max-depth` 4 |

  - the max 7 props rule doesn't exist off the shelf; I check it in review and, if needed, write a local rule in M1;
  - bans (`no-restricted-imports`):
    - `expo`, `expo-*` and `@expo/*` everywhere;
    - `@react-native-async-storage/async-storage` and `@dr.pogodin/react-native-fs` outside `src/storage/**` and `src/repositories/**`;
    - literal hex values outside `src/shared/theme/**` (`no-restricted-syntax` on `/#[0-9a-fA-F]{3,8}/`).
- **`eslint-plugin-boundaries`**, with the elements `app`, `feature`, `service`, `repository`, `storage`, `shared` and the rules:
  - `app` → anything;
  - `feature` → `service`, `shared` and another `feature` only through `index.ts`;
  - `service` → `shared`;
  - `repository` → `storage`, `shared`;
  - `storage` → `shared`;
  - `shared` → `shared`;
  - plus `import/no-cycle`.
- **Jest:** `react-native` preset, `@testing-library/react-native`, `jest.setup.ts` with the official mocks (AsyncStorage, Reanimated, gesture-handler, safe-area, bootsplash) and `transformIgnorePatterns` for the ESM packages (`@react-navigation`, `lucide-react-native`, `@noble/hashes`, `uuid`).
- **Sentinel tests** for the rules: fixture files that intentionally violate `boundaries` and `no-restricted-imports` (including an `expo-*` import), run with the `ESLint` API in a Jest test, which checks that the rules report the errors.
- **Check:** `npm run check` green.

### 5. The `src/` structure and navigation
**Done** (2026-11-19). `npm run check` is green, with 27 tests. Verified on the emulator: the Bibliotecă / Ascultă / Setări tabs, `abook://book/test-1` opens "Detalii carte" with the id, and `abook://settings` opens the Setări tab.
- **Moved from step 6:** `ro.json` with typed keys (`i18next.d.ts`), synchronous `i18n`, `I18nProvider` and `AppProviders`, because the tab labels can't be hard-coded.
- `BookScreen` receives `bookId` as a prop. The `BookRoute` adapter in `app/navigation` reads the route parameter, so features don't import navigation types. `ReactNavigation.RootParamList` is declared globally for `useNavigation()`.
- `BookId` (branded type) is in `shared/domain`, and `ScreenPlaceholder` (temporary) is in `shared/ui`.
- **Native:** `abook://` intent-filter (Android), `CFBundleURLTypes` (iOS) and `RNScreensFragmentFactory` in `MainActivity` (recommended by `react-native-screens`).
- **Tests:** in Testing Library v14, `fireEvent.press` is async and must be awaited. The bottom-tabs buttons don't have the `tab` role.
- **Visually, until M1:** the placeholder text is black on black and the tabs have no icons. Solved with tokens and with `BottomTabBar`.

- The folders from PROMPT §3, each with a minimal `index.ts`, so the `boundaries` rules have something to check:
  - `src/features/{library,import,book,player,settings}` (each with a placeholder `screens/`);
  - `src/services/{pdf,text,tts}`, `src/repositories`, `src/storage/migrations`;
  - `src/shared/{ui,theme,i18n,domain,utils}`.
- `src/app/navigation/`:
  - `types.ts`: `RootStackParamList` (`Tabs`, `Import`, `Book: { id: BookId }`), `TabsParamList` (`Library`, `Player`, `Settings`) and the global `ReactNavigation.RootParamList` declaration, for typed `navigation.navigate`;
  - `RootNavigator.tsx`: native stack, with `Import` as `presentation: 'modal'`;
  - `TabsNavigator.tsx`: bottom tabs (the default tab bar for now; the custom `BottomTabBar` comes in M1);
  - `linking.ts`: the `abook://` scheme (`book/:id`, `import`).
- The navigators only register the screens exported from `features/<f>/index.ts` (decision 4).
- **Tests:** the navigator renders the Library tab; `navigate('Book', { id })` reaches the details screen.

### 6. Providers, fonts, splash, i18n
**Done** (2026-11-19). `npm run check` is green, with 40 tests. Verified on the emulator: splash with the amber logo on `#111316`, then "Biblioteca mea" in Space Grotesk Bold.
- The fonts come from official sources (OFL): Inter v4.1 (`rsms/inter`, Regular + SemiBold) and Space Grotesk (`floriankarsten/space-grotesk`). Space Grotesk **has no static SemiBold**, so we use Medium (500) and Bold (700). The licenses are in `assets/licenses/`.
- The files carry the PostScript name (checked from the `name` table), so `fontFamily` is identical on Android and iOS. `react-native-asset` links them (`react-native.config.js`).
- The `__tests__/fonts` test checks that every `fontFamily` exists in `assets/fonts`, in Android and in `UIAppFonts`.
- The splash is generated by `react-native-bootsplash` from `assets/brand/splash-logo.svg` (the Lucide `file-headphone` icon, ISC). It's initialized in `MainActivity`/`SceneDelegate` and hidden at `NavigationContainer.onReady`.
- `shared/theme` already has `fontFamily` and the `bg`/`text` colors. The rest of the tokens come in M1.
- **For M1:** after the splash, the status bar has dark icons on a dark background. It needs `StatusBar` with `barStyle="light-content"`.

- `src/shared/i18n/ro.json` (titles of the tabs and of the placeholder screens) and `src/app/providers/I18nProvider.tsx`; no hard-coded text.
- `src/app/providers/AppProviders.tsx` composes `GestureHandlerRootView`, `SafeAreaProvider`, `I18nProvider` and `NavigationContainer` (with `linking` and a provisional dark theme). `StoreProvider` and `ThemeProvider` are added in M1 and M2, as slots.
- Fonts:
  - download Inter (400/600) and Space Grotesk (600/700) as `.ttf` into `assets/fonts/` (OFL license, included in `assets/fonts/LICENSE`);
  - link them with `react-native.config.js` (`assets: ['./assets/fonts']`) and `npx react-native-asset`;
  - check the PostScript names so `fontFamily` is identical on Android and iOS.
- Splash: `react-native-bootsplash generate` with the background color `#111316` (the only color defined outside tokens, in the native config) and `BootSplash.hide()` after navigation mounts. In M2, `hide()` also waits for `bootstrap.ts`.
- **Tests:** render `AppProviders` with a child; the tabs show the 3 Romanian labels.

### 7. Direct native settings
**Done** (2026-11-19). `npm run check` is green, with 48 tests. I checked the manifests merged by Gradle (`processDebugMainManifest` / `processReleaseMainManifest`):
- **Release:** no network or shared storage permissions. Only `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` remains, internal, signature-level.
- **Debug:** `INTERNET` (`src/debug`), plus `ACCESS_LOCAL_NETWORK` and `SYSTEM_ALERT_WINDOW`, coming from RN dev support.
- I removed `READ/WRITE_EXTERNAL_STORAGE` (brought in by a library) from `main`, so from both variants: the PDF comes through the document picker.
- iOS: `UIBackgroundModes` = `audio`.
- AsyncStorage: nothing to set, because v3 no longer has `AsyncStorage_db_size_in_MB` (see step 3).
- The `__tests__/native` test pins these rules in the source manifests and in `Info.plist`.
- `run-android.ps1` stops the app before reinstalling. Otherwise a stale ANR dialog ("no focused window") stayed on screen over the new instance. A clean start in debug took 2.45 s.

- `android/gradle.properties`: `AsyncStorage_db_size_in_MB`. **First** I check in the docs of the installed AsyncStorage version whether the property is still called that (v2/v3 may differ). If it no longer applies, I note it in `PLAN.md` and keep the risk for M2.
- `ios/ABook/Info.plist`: `UIBackgroundModes` = `audio`.
- `AndroidManifest.xml`: no `INTERNET` permission in the release build. It stays in `src/debug/` for Metro, as a guarantee for "no network at runtime".
- **Check:** the Android build passes; the properties appear in the native files.

### 8. `.claude/scripts/run-android.ps1`
**Done** (2026-11-19). The script is verified in all modes, with exit code 0 in each case:

| Case | Result |
| --- | --- |
| A. `-ForceBuild -ResetCache` | Metro restarted with a clean cache, build in 25 s, total 48 s |
| B. no parameters, no native changes | no build, total 12 s |
| C. `-SkipBuild` | no build, total 13 s |
| D. `-EmulatorOnly` | emulator + Metro, total 7 s |
| E. emulator stopped | orphan locks deleted, off-screen window moved, boot in 2 s (snapshot), total 19 s |

Changes after the initial version: JDK ≤ 20 for the build only (step 2), granting `ACCESS_LOCAL_NETWORK` in debug (step 2), `force-stop` before reinstalling (step 7). The npm scripts are `npm run emu` (with arguments after `--`) and `npm run emu:rebuild`.

The `techspeak` script is also for RN CLI, so I copied it and changed a little:

| In techspeak | In ABook |
| --- | --- |
| `$ProjectRoot` = `..\..\app` | `..\..` (repo root) |
| `com.techspeak` / `com.techspeak.MainActivity` | `com.abook` / `com.abook.MainActivity` |
| `yarn` with `npx` fallback | `npm run start` / `npx react-native run-android` (no yarn) |
| Native fingerprint: `android/**`, `package.json`, `yarn.lock` | `android/**`, `package.json`, `package-lock.json` |
| Inherited `JAVA_HOME` | set to the JDK required by RN 0.88 for the build process only, if it differs from the current one |
| Microphone permission dialog (step 8) | removed (ABook doesn't ask for the microphone) |

- The rest stays: steps 1–8, exit codes 0–6, logs in `android\build\run-android\`, the off-screen window fix, automatic cold boot, the duplicate Metro warning.
- **Check:** the first run builds and opens the app. The second run, without native changes, only restarts the app. The run with `-ForceBuild -ResetCache` works.

### 9. `CLAUDE.md`
**Done** (2026-11-19). It contains the sources of truth, the mandatory rules, the commands, the structure and layers, plus the pitfalls found in M0 (JDK, TTS, AsyncStorage 3, Testing Library v14, ESLint 9, fonts, splash, manifest, committing from PowerShell).
- A short file at the root, pointing to `.claude/PROMPT.md`, `.claude/PLAN.md` and `.claude/plans/`.
- The main rules:
  - React Native CLI, **no Expo**;
  - skills are loaded before storage, import or player code;
  - the `npm run check` and `run-android.ps1` commands;
  - the branch convention: `m<N>-<name>` from `dev`.

### 10. Closing
**Done** (2026-11-19). `npm run check` is green, with 48 tests in 6 suites, and `npm run emu` opens the app with the Bibliotecă / Ascultă / Setări tabs.
- The closing check found `fontSize: 28/16` written directly in `ScreenPlaceholder`, a violation of the "no magic numbers" rule. I fixed it with `shared/theme/typography.ts` (`fontSize.display` / `fontSize.body`, from PROMPT §7).
- The transitive dependency `@expo/config-plugins` comes from `react-native-bootsplash`, for its optional Expo plugin. I checked that it doesn't reach the app: the JS bundle (8.4 MB) has 0 references to `expo`/`@expo`, and the native build doesn't use it. I accept it as a documented exception. Lint forbids any `expo*` import from our code anyway.

#### `modular-architecture` §10 checklist
- [x] No file exceeds the limits. The largest has 33 lines (`TabsNavigator.tsx`), and the limits are enforced by ESLint.
- [x] No upward imports or imports into another feature's internals, and no cycles. `boundaries` enforces it, and 19 sentinels prove it.
- [x] No duplicated markup or logic. The placeholder screens reuse `ScreenPlaceholder`.
- [x] No hard-coded texts, colors or sizes: texts are in `ro.json`, colors and sizes in `shared/theme`.
- [x] The new units are in the right layer and exported through `index.ts`.
- [x] Tests added and green.
- [x] `typecheck`, `lint` and `test` pass.

#### Summary (per the skill)
- **New units:**
  - `app`: `App`, `AppProviders`, `I18nProvider`, `RootNavigator`, `TabsNavigator`, `BookRoute`, `linking`, the navigation types;
  - `features`: `LibraryScreen`, `PlayerScreen`, `SettingsScreen`, `ImportScreen`, `BookScreen`;
  - `shared`: `ScreenPlaceholder`, `BookId`/`toBookId`, `i18n` + `ro.json`, `color`, `fontFamily`, `fontSize`.
- **Reused:** `ScreenPlaceholder`, in all 5 screens.
- **`arch-exception`:** none.

## Definition of done – M0

- [x] RN CLI 0.88.1 project, New Architecture (`newArchEnabled=true`, `RCTNewArchEnabled`), zero direct `expo*` dependencies (lint + `npm ls`). The transitive exception is described above and doesn't reach the app.
- [x] The app starts on `Pixel_10_Pro_XL` with a single command (`npm run emu`), verified in 5 modes.
- [x] 3 tabs + `Import` (modal) and `Book` (`{ id }`), with typed `ParamList`s and deep links verified on the emulator.
- [x] The Inter and Space Grotesk fonts load, and the splash disappears only after mounting (test + emulator).
- [x] All texts come from `ro.json`, with typed keys.
- [x] `typecheck`, `lint` and `test` are green, and the sentinel tests prove that `boundaries` and the bans are active.
- [x] All native dependencies are installed and compiled. The `react-native-tts` spike failed (Gradle 9), and the solution is the custom TurboModule in M5.
- [x] `CLAUDE.md` is written, and `.claude/` is committed.

## M0 risks

| Risk | Mitigation |
| --- | --- |
| JDK 25 incompatible with the Gradle/AGP of RN 0.88 | JDK 17 is installed; the script sets it for the build only |
| `react-native-tts` unmaintained (last release 2024) on the New Architecture | spike in step 3; the fallback is a custom TurboModule in M5 |
| A native library isn't yet compatible with RN 0.88 | pin the latest compatible version; worst case, RN 0.87 |
| `eslint-plugin-boundaries` doesn't support flat config well | the alternative from PROMPT: `dependency-cruiser`, run in `lint` |
| The `AsyncStorage_db_size_in_MB` property no longer exists in the installed version | documented and handled in M2 (possibly text in files) |
| iOS can't be verified on Windows | `ios/` kept correctly in the repo; iOS verification happens in M7 on a Mac |
