# M1 – Design system

Branch: `m1-design-system`. References: `PLAN.md` (M1), `PROMPT.md` §7 (tokens, screens) and §8 (accessibility), the `modular-architecture` skill §2, §4–§6, §10, the mockups in `.claude/design/`.

## Goal

All the tokens from PROMPT §7 and all the primitives in `shared/ui`, built only on tokens, with accessibility in the contract and tested. The custom tab bar (Lucide icons, amber accent) replaces the default one. No real screen yet.

## Assumptions

- M0 is brought into `dev` through a local merge (`m0-schelet-rn` → `dev`, fast-forward), and `m1-design-system` starts from `dev`. No push.
- A single (dark) theme. `ThemeProvider` exists for the contract and tests, but the tokens are static constants, used directly in `*.styles.ts` (`StyleSheet.create`), with no style re-creation on render.
- "Extra" primitives compared to the PROMPT list, needed so typography and icons aren't duplicated: `AppText` (variants `display | title | body | bodyStrong | caption | overline`) and `Icon` (Lucide wrapper with sizes and colors from tokens). I report them as additions, not deviations.
- Number formatting is done by hand, with the Romanian decimal comma ("1,2 MB"), without relying on `Intl` support in Hermes.
- `Select` (the voice), the segmented storage bar, the mini-player and the player controls are not part of M1: they are feature compositions (M5/M6) on top of the primitives.

## Steps

Each step ends with a green `npm run check` and a separate commit; the step's section is completed with "**Done** (date). Findings: …".

### 1. Branch and skills
- Local merge of M0 into `dev`, then `git switch -c m1-design-system`.
- Load `modular-architecture` (component structure, limits, §6 reuse, §10 DoD).
- **Check:** `git log dev` contains `d983cd1`.

**Done** (2026-11-19). Findings: the M1 plan was committed on `m0-schelet-rn` (`c007736`), and `dev` advanced by fast-forward. `git switch` rewrote the whole working copy with CRLF, because of `core.autocrlf=true` in the global Git config, and `prettier --check` failed on 43 untouched files. The durable fix is `* text=auto eol=lf` in `.gitattributes` (goes into the step 2 commit). `Set-Content` in PS 5.1 puts a BOM in the commit message, so the message file is written with the Write tool.

### 2. Complete tokens in `shared/theme`
- `colors.ts`: the whole palette from PROMPT §7 (`bg`, `surface`, `surfaceRaised`, `border`, `divider`, `tabBar`, `text`, `textMuted`, `textRead`, `accent`, `onAccent`, `success`, `successBg`, `danger`, `dangerBorder`, `info`, `cover[]`).
- `spacing.ts`: `space` (4, 8, 12, 16, 20, 24) + semantic aliases (`screenPadding: 20`, `cardGap: 16`).
- `radius.ts`: 6, 8, 12, 14, 16, 20, `pill`, with aliases (`coverSm`, `input`, `button`, `card`).
- `typography.ts`: replaces `fontSize` with `type.{display,title,body,bodyStrong,caption,overline}` (family, size, `lineHeight`, `letterSpacing`, `textTransform`), keeping the export used by `ScreenPlaceholder` or migrating it.
- `sizes.ts`: `touchTarget: 44`, `playButton: 76`, `icon.{sm,md,lg}`, `tabBarHeight`, `maxFontScaleHeader: 1.4`.
- `motion.ts`: `duration.highlight: 150`, `opacity.highlight: 0.18`, `opacity.disabled`.
- `contrast.ts`: `relativeLuminance` and `contrastRatio` (pure functions, WCAG 2.x).
- `coverColor.ts`: `pickCoverColor(id: BookId)` — deterministic hash (djb2) modulo `color.cover.length`.
- **Tests:** contrast ≥ 4.5:1 for `text`, `textMuted`, `textRead`, `danger`, `success`, `accent` on `bg` and `surface`, and `onAccent` on `accent`; `pickCoverColor` stable and distributed over all 3 colors; tokens without `undefined` values.

**Done** (2026-11-19). Findings: all pairs pass 4.5:1, including `textRead` / `textMuted` / `info` on `tabBar`, `text` and `textMuted` on `surfaceRaised`, `success` on `successBg` and `text` on the 3 cover colors. The `textRead` risk didn't materialize. The export is called `type` (as in PROMPT), and TS accepts it in `import { type }`. Tokens beyond the plan: `radius.coverLg` / `cardLg`, `size.buttonLg`, `progressBar`, `coverSm` / `coverLg`, `emptyStateIcon`, `switch`, `opacity.pressed`. `type.title` uses Space Grotesk Bold, because SemiBold doesn't exist. djb2 is written without bitwise operators (the `no-bitwise` rule from the RN config).

### 3. `ThemeProvider`, `useTheme`, integration into the app
- `shared/theme/ThemeProvider.tsx` + `useTheme()` (context with the `theme` object; throws outside the provider).
- `AppProviders`: add `ThemeProvider`. `NavigationContainer` gets a theme derived from tokens (`navigationTheme.ts` in `app/navigation`), instead of the provisional theme.
- `StatusBar barStyle="light-content"` with a `color.bg` background (noted in M0 step 6).
- `ScreenPlaceholder` switches to the new tokens (fixes the black-on-black text from M0).
- **Tests:** `useTheme` returns the tokens; throws outside the provider; `App` renders with the provider.

**Done** (2026-11-19). Findings: in RN 0.88 `StatusBar` no longer has `backgroundColor` (edge-to-edge on Android), so it's just `barStyle="light-content"`, and the background comes from `GestureHandlerRootView`, with `color.bg`. `theme.ts` gathers all tokens into one object, and `ThemeProvider` exposes it through context. Styles stay static. `navigationTheme` keeps the fonts from `DarkTheme` and has its own test. `renderHook` is async in Testing Library v14, and the error outside the provider is caught with `await expect(async () => …).rejects`.

### 4. Local ESLint rule "max 7 props"
- Local plugin in `eslint.config.js` (`local/max-props`): counts the members of the `*Props` type in `*.types.ts` / the component's destructured parameter; threshold 7 (skill §2).
- New sentinel in `__tests__/lint/architecture-rules.test.ts` (fixture with 8 props → error, 7 → ok).
- **Check:** `npm run lint` reports the fixture; the rest of the code passes.

**Done** (2026-11-19). Findings: the rule lives in `eslint-rules/max-props.js` and is registered as the `local` plugin on `src/**`, without tests. It counts the own members of `*Props` interfaces and types, including the sum of the literals in an intersection. Referenced or extended types aren't expanded, so `extends PressableProps` doesn't add to the count. It also counts the properties of the destructured parameter of a PascalCase function, without `...rest`. The 4 sentinels (interface with 8 props, 4 + 4 intersection, destructuring with 8 props, the allowed cases) use `lintText`, so no on-disk fixture is needed.

### 5. Foundations: `AppText` and `Icon`
- The structure of each primitive (skill §4): `shared/ui/<Name>/{<Name>.tsx, .styles.ts, .types.ts, use<Name>.ts (only if it has logic), <Name>.test.tsx, index.ts}`, exported from `shared/ui/index.ts`.
- `AppText`: `variant`, `color` (token key, not hex), `maxFontSizeMultiplier` defaulting to 1.4 for `display`/`title`; optional `accessibilityRole="header"`.
- `Icon`: `name` from a typed map of the Lucide icons used in the mockups (`book`, `headphones`, `sliders-horizontal`, `plus`, `play`, `pause`, `check`, `circle`, `chevron-left`, `chevron-down`, `more-horizontal`, `bookmark`, `moon`, `rotate-ccw`, `rotate-cw`, `skip-back`, `skip-forward`, `file-headphone`, `search`, `settings`), `size` from `sizes.icon`, `color` from tokens. Decorative by default (`accessible={false}`).
- **Tests:** variant → correct style; the font scaling limit; the icon renders and is hidden from accessibility.

**Done** (2026-11-19). Findings: in Jest, `lucide-react-native` resolves to `dist/esm/*.mjs`, and the RN preset transform (only `.js` / `.ts`) skips it, even though the package is in `ESM_PACKAGES`. The fix is a `moduleNameMapper` to `dist/cjs/lucide-react-native.js`. In Lucide 1.75, `MoreHorizontal` is called `Ellipsis`, and the app keeps the name `more-horizontal`. I added `trash`, `upload`, `download` and `x` for Details and Settings. `AppText` extends `TextProps` (without typographic `style`): `style` is only for layout, and color styles are precomputed per token. `Icon` gets `filled` (the filled play triangle). It's hidden from accessibility (`accessible={false}` + `no-hide-descendants`), and the test finds it only with `includeHiddenElements`. `ScreenPlaceholder` now uses `AppText`.

### 6. Interactive primitives: `Button`, `IconButton`, `Chip`, `ChipGroup`, `Switch`
- `Button`: variants `primary | secondary | ghost | danger`, `size` (`md`, `lg` for pill CTAs like "Importă primul PDF" / "Continuă de la pagina 34"), optional `icon`, `loading`, `disabled`; `accessibilityRole="button"`, `accessibilityState={{ disabled, busy }}`, `minHeight: touchTarget`.
- `IconButton`: `icon`, `accessibilityLabel` **required** in the type, `hitSlop` up to 44 pt, `filled` variant for the 76 pt play.
- `Chip`: `label`, `selected`, optional `onPress` (non-clickable metadata chip vs. filter); `button` role + `selected` in the state.
- `ChipGroup<T>`: `options`, `value`, `onChange`, `radiogroup`/`radio` role; logic in `useChipGroup`.
- Custom `Switch` (the mockup has a dark thumb on an amber track, impossible with RN's `Switch`): `Pressable` + Reanimated (`withTiming` 150 ms), `switch` role, `accessibilityState={{ checked }}`.
- **Tests:** every variant renders; `onPress` / `onChange` called with `await fireEvent.press`; `disabled` blocks the press; the accessibility states.

**Done** (2026-11-19). Findings:
- **Reanimated 4.7 in Jest:** the official mock (`react-native-reanimated/mock`) is unusable. It imports `src/index`, where `initializers.native.ts` calls `setCSSEventHandler` on JSReanimated (picked when `IS_JEST`), and it throws there. It didn't crash until now, because nobody imported Reanimated. I replaced it in `jest.setup.js` with a minimal manual mock (`Animated.*`, `useSharedValue`, `useAnimatedStyle`, `withTiming`, `withSpring`…), where animations reach the target value instantly. The mock is extended when a new API shows up.
- **`radiogroup`:** the `ChipGroup` container stays non-accessible (with `accessible`, TalkBack would swallow the radios), so RNTL's `getByRole('radiogroup')` doesn't find it. The test looks it up by label and checks the role.
- **The 7 props limit:** `Button` has exactly 7 (`label`, `onPress`, `variant`, `size`, `icon`, `loading`, `disabled`). I dropped `testID`, and tests search by role and name. The width comes from the parent (default `alignSelf`), without a `fullWidth` prop.
- **Variants:** `lg` = 52 pt, pill. `secondary` = `surfaceRaised` (PROMPT), `danger` = `dangerBorder` outline + `danger` text.
- **Filled icons:** `Icon` fills the playback glyphs (`play`, `pause`) by default, as in the mockups. `IconButton` with `active` fills the icon and colors it with `accent` (bookmark set).
- **44 pt targets:** `Chip` (32 pt) and `Switch` (28 pt) reach 44 pt through `hitSlop` computed from tokens.
- **Shared feedback:** `feedback.styles.ts` (pressed / disabled) is used by all pressable primitives.

### 7. Display primitives: `Card`, `ProgressBar`, `ListRow`, `BookCover`, `EmptyState`, `ScreenHeader`
- `Card`: `surface`, `radius.card`, padding from tokens; the `raised` variant.
- `ProgressBar`: `value` 0–1 (clamped), `tone` (`accent | success | info`), `border` track; `progressbar` role with `accessibilityValue={{ min: 0, max: 100, now }}`.
- `ListRow`: `title`, `subtitle?`, `leading?`, `trailing?` (slot: Switch, text, icon), `onPress?`, `divider`; target ≥ 44 pt; with `onPress`, `button` role.
- `BookCover`: `id`, `title`, `author`, `size` (`sm | lg`); color from `pickCoverColor`; author on top, title at the bottom (the "Detalii carte" mockup); `accessibilityLabel` composed from i18n.
- `EmptyState`: `icon` in a `surface` circle, `title`, `description`, `action?` (a `Button`), `note?` (the "Bibliotecă goală" mockup).
- `ScreenHeader`: variants `large` (display title "Biblioteca mea" / "Setări" + right action) and `compact` (back, overline + centered title, right action — the Player/Details mockup); top safe area; title with `header` role and `maxFontSizeMultiplier` 1.4.
- **Tests:** render, slots, `ProgressBar` clamp, deterministic color for `BookCover`, the `EmptyState` action, back in `ScreenHeader`.

**Done** (2026-11-19). Findings:
- **Plan ↔ skill conflict:** `BookCover` receives an already-translated `accessibilityLabel`, not one "composed from i18n", because skill §3 forbids i18n keys in primitives. The skill won; the feature composes the label (M4).
- **`clamp`** is in `shared/utils` (the first unit there). It's used by `useProgressBar` and, in step 10, by `formatPercent`.
- **`Card`:** `padded={false}` keeps only the horizontal padding, for lists with rows and separators (Settings). The radius is `radius.cardLg` (20), as in the mockups.
- **`ListRow`:** `tone` (`default | muted | active`) covers the chapter states in "Detalii carte" without color props and stays at 7 props. The pressable row takes its label from the children's text.
- **`BookCover`:** is `React.memo` (it will live in lists). `sm` shows the title initial, `lg` the author on top and the title at the bottom. Backgrounds are precomputed per color.
- **`ScreenHeader`:** `compact` uses `bodyStrong` for the title, with an explicit `maxFontSizeMultiplier` 1.4. The safe area comes from `useScreenHeader` (memoized on `top`). When the back button is missing, the left slot stays empty, so the title stays centered.
- **`EmptyState`:** the action is a `Pick<ButtonProps>`, rendered as `Button size="lg"`.
- **Lint:** `memo(function BookCover…)` triggers `no-shadow`, so the inner function is called `BookCoverView`.

### 8. `Slider`
- Wrapper over `@react-native-community/slider` with colors from tokens (`accent` / `border`), `label`, `valueLabel` (e.g. "1.0×", "Normal" — the Settings mockup), `step`, `onChange` / `onComplete`; `accessibilityLabel` + `accessibilityValue`.
- Mock in `jest.setup.js` for the slider (native component).
- **Tests:** propagates `value` / `onComplete`; the label and the displayed value.

**Done** (2026-11-19). Findings: `@react-native-community/slider` 5.2 renders in Jest without a mock (the codegen component becomes a host), and `fireEvent(…, 'valueChange' | 'slidingComplete')` reaches the callbacks. The risk didn't materialize and I didn't add the mock. `min / max / step` are grouped in `range`, to stay at 7 props. `valueTone` (`accent` for "1.0×", `muted` for "Normal") follows the Settings mockup. `valueLabel` is also `accessibilityValue.text`, so TalkBack announces "1.0×", not the raw number.

### 9. `BottomTabBar` and replacing the tab bar
- `shared/ui/BottomTabBar`: receives `items: { key, label, icon, focused, onPress }[]` (no React Navigation types in `shared`); `tabBar` background, active `accent`, inactive `textMuted`; `tab` role, `selected`; bottom safe area.
- Adapter in `app/navigation/TabBarAdapter.tsx` mapping `BottomTabBarProps` → `items` (icons `book`, `headphones`, `sliders-horizontal`), used in `TabsNavigator` through `tabBar`.
- **Tests:** in `RootNavigator.test.tsx`, pressing "Setări" switches the tab and the active item has `selected`. (Note: the tabs **will now have** the `tab` role, so the pitfall in `CLAUDE.md` gets updated.)

**Done** (2026-11-19). Findings: `BottomTabBar` doesn't use React Navigation types, and `TabBarAdapter` (in `app/navigation`) emits `tabPress` with `canPreventDefault` before `navigate`, like the default tab bar. `tabBar` gets a module-level function (`renderTabBar`), so no new component is created on every render. Each tab is a memoized `BottomTabBarItem`, with `tab` role and `selected`. The container has the `tablist` role. The tab label is capped at 1.4×. Tests now find the tabs with `getByRole('tab')`.

### 10. `shared/utils`: formatting
- `formatBytes.ts` (`1,2 MB`, `8,9 MB`, `512 KB`), `formatDuration.ts` (`~ 1 h 52 min`, `12 min`, `< 1 min`), `formatPercent.ts` (`41%`, clamp 0–100). Units and suffixes come from `ro.json` (`format.*`) or are parameters, so the functions stay pure.
- Table-driven **tests**: 0, unit boundaries, rounding, negative/NaN values.

**Done** (2026-11-19). Findings:
- **Pure functions:** units come as a parameter (`ByteUnits`, `DurationUnits`), and the strings live in `ro.json` → `format.bytes` / `format.duration`. The tests read them from there. Features will get them with `t('format.bytes', { returnObjects: true })`.
- **"~" and "rămase":** the prefix and suffix belong to the feature's sentence (e.g. `player.remaining: "~ {{duration}} rămase"`), not to the formatter. So `formatDuration` gives "1 h 52 min", "2 h", "12 min", "< 1 min".
- **`formatDecimal`:** decimal comma, no trailing ",0", no `Intl`.
- **`formatBytes`:** promotes the unit after rounding (1023.6 KB → "1 MB", not "1024 KB"). B and KB are integers, MB and GB have one decimal.
- **`formatPercent`:** takes a ratio between 0 and 1, like `ProgressBar`, and reuses `clamp`.

### 11. Visual catalog (`__DEV__` only) and emulator check
- `src/app/dev/UiCatalogScreen.tsx`, registered in `RootNavigator` only when `__DEV__`, deep link `abook://dev/ui`: all primitives in all variants, for comparison with the mockups.
- **Check:** `npm run emu`, then `adb shell am start -d abook://dev/ui`; screenshots compared with `01-biblioteca-goala.png`, `03-detalii-carte.png`, `05-setari.png` (tab bar, buttons, chips, switch, slider, cover, empty state). TalkBack on in the catalog: every control announces its role and label in Romanian.

**Done** (2026-11-19). Findings:
- **Structure:** the catalog lives in `src/app/dev/` (screen + 5 sections + `samples.ts`). The `DevUi` route and the `dev/ui` link exist only when `__DEV__`. The sample texts in `samples.ts` copy the mockups and don't go through i18n, because they aren't product copy.
- **Build:** `npm run emu` redid the native build, even though M1 has no native changes. The hash of the native files changed after the LF normalization in step 2.
- **Comparison with the mockups** (emulator screenshots): the fonts, the tab bar (active amber, light status bar), the buttons, the 76 pt play, the chips, the switch (dark thumb on amber track), the large cover, the chapter rows and the empty state match. The black-on-black text from M0 is gone.
- **Accessibility** (`uiautomator dump` instead of listening to TalkBack): every control has a Romanian `content-desc`. Radios and switches have `checkable` / `checked`, tabs have `selected`, disabled buttons have `enabled=false`, the loading button announces "…, busy", and the sliders announce "Viteză implicită, 1.0×". The IconButtons are 132 px = 44 dp.
- **Deviations, to be solved in M6 (Settings / Player):** (1) the slider's native node is ≈ 18 dp tall, even though the style asks for 44 (the SeekBar keeps its intrinsic height), so the touch target is below 44 pt; (2) the empty track (`border` on `surface`) is barely visible, while the mockup has a thicker, lighter track. Both probably require a custom slider (Gesture Handler + Reanimated).
- **Speed:** displayed as "1.0×" (dot and one decimal, as in the mockup), not through `formatDecimal`. The feature decides the speed format in M6.

### 12. Closing
- `modular-architecture` §10 checklist, the summary (new / reused units / `arch-exception`), updating `PLAN.md` (M1 ✅) and `CLAUDE.md` (new pitfalls).

## Definition of done – M1

- [x] All tokens from PROMPT §7 exist in `shared/theme`; zero hex outside it (lint).
- [x] The contrast test passes (≥ 4.5:1 for all text/background pairs used).
- [x] The 13 primitives from PROMPT + `AppText` and `Icon` exist, each with a complete folder and tests (render, interaction, accessibility).
- [x] Every control has a role, a state and a Romanian label; headers capped at 1.4×; targets ≥ 44 pt, **with one exception**: the native `Slider` on Android (≈ 18 dp), moved to the M6 risks in `PLAN.md`.
- [x] The "max 7 props" rule is active and proven by a sentinel.
- [x] The custom tab bar is used in the app and verified on the emulator; the status bar is light.
- [x] `formatBytes`, `formatDuration`, `formatPercent` tested.
- [x] `npm run check` green (208 tests, 28 suites); one commit per step.

### 12. Closing — **Done** (2026-11-19)

**`modular-architecture` §10 checklist:** the size limits are enforced by lint on `shared/ui` (≤ 150 lines) and on `shared/utils` (≤ 40 / 200), plus 7 props through `local/max-props`. There is no `arch-exception`. Imports only go downward: `app/dev` → `shared`, and `shared` imports nothing from above (boundaries + `no-cycle`). Nothing is duplicated: the press feedback is in `feedback.styles.ts`, `clamp` is used by `ProgressBar` and `formatPercent`, `AppText` is the only way to render text (and `ScreenPlaceholder` switched to it). There are no hex values, magic numbers (exception: the height of the demo box in the dev catalog, commented) or inline styles created on every render; dynamic values are memoized in hooks. Every primitive has tests.

**New units:**
- **`shared/theme`:** `spacing`, `radius`, `sizes`, `motion`, `contrast`, `coverColor`, `theme`, `ThemeProvider`, `useTheme`.
- **`shared/ui`:** `AppText`, `Icon`, `Button`, `IconButton`, `Chip`, `ChipGroup` (`useChipGroup`), `Switch` (`useSwitch`), `Card`, `ProgressBar` (`useProgressBar`), `ListRow`, `BookCover`, `EmptyState`, `ScreenHeader` (`useScreenHeader`), `Slider`, `BottomTabBar` (`BottomTabBarItem`, `useBottomTabBar`), `feedback.styles`.
- **`shared/utils`:** `clamp`, `formatDecimal`, `formatBytes`, `formatDuration`, `formatPercent`.
- **`app`:** `navigationTheme`, `TabBarAdapter`, `app/dev/*` (the catalog).
- **Tooling:** `eslint-rules/max-props.js`.

**Reused units:** `fonts.ts`, `BookId`, `ScreenPlaceholder` (migrated), `I18nProvider`, `linking`, the `run-android.ps1` script.

**Deviations from the plan:**
- `BookCover` receives the already-translated label (skill §3 > plan).
- `Slider` didn't need a mock.
- The Reanimated mock is manual.
- Beyond the plan: `clamp` and `formatDecimal`.
- The `Slider` target on Android is below 44 pt (deferred to M6).

**New pitfalls** are in `CLAUDE.md` → "Pitfalls found in M1".

## M1 risks

| Risk | Mitigation |
| --- | --- |
| `textRead` (#8A9099) or `textMuted` below 4.5:1 on `surfaceRaised` | the test shows it; they are used only on `bg`/`surface`, or the token is adjusted and reported |
| The Reanimated mock doesn't cover the `Switch` animation | we test state and accessibility, not the animation; the animation is checked on the emulator |
| `@react-native-community/slider` has no official Jest mock | manual mock in `jest.setup.js` |
| The local ESLint props rule is fragile on complex types (intersections, generics) | it counts only type literals / `*Props` interfaces; the rest is left to review |
| `lucide-react-native` ESM in Jest | already in `ESM_PACKAGES`; checked at the first test with `Icon` |
