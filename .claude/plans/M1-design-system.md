# M1 – Design system

Branch: `m1-design-system`. Referințe: `PLAN.md` (M1), `PROMPT.md` §7 (tokens, ecrane) și §8 (accesibilitate), skill-ul `modular-architecture` §2, §4–§6, §10, machetele din `.claude/design/`.

## Obiectiv

Toate token-urile din PROMPT §7 și toate primitivele din `shared/ui`, construite doar pe tokens, cu accesibilitatea în contract și testate. Tab bar-ul propriu (iconițe Lucide, accent chihlimbar) înlocuiește pe cel implicit. Niciun ecran real încă.

## Presupuneri

- M0 se aduce în `dev` printr-un merge local (`m0-schelet-rn` → `dev`, fast-forward), iar `m1-design-system` pornește din `dev`. Fără push.
- O singură temă (întunecată). `ThemeProvider` există pentru contract și teste, dar token-urile sunt constante statice, folosite direct în `*.styles.ts` (`StyleSheet.create`), fără re-creare de stiluri la randare.
- Primitivele „extra” față de lista din PROMPT, necesare ca să nu se dubleze tipografia și iconițele: `AppText` (variante `display | title | body | bodyStrong | caption | overline`) și `Icon` (wrapper Lucide cu mărimi și culori din tokens). Le semnalez ca adăugiri, nu ca abateri.
- Formatarea numerelor se face manual, cu virgulă zecimală românească („1,2 MB”), fără să depindem de suportul `Intl` din Hermes.
- `Select` (vocea), bara de stocare segmentată, mini-playerul și controalele playerului nu intră în M1: sunt compoziții de feature (M5/M6) peste primitive.

## Pași

Fiecare pas se încheie cu `npm run check` verde și un commit separat; secțiunea pasului se completează cu „**Făcut** (data). Ce am constatat: …”.

### 1. Branch și skill-uri
- Merge local M0 în `dev`, apoi `git switch -c m1-design-system`.
- Încarc `modular-architecture` (structura componentei, limite, §6 reutilizare, §10 DoD).
- **Verificare:** `git log dev` conține `d983cd1`.

**Făcut** (2026-11-19). Ce am constatat: planul M1 s-a comis pe `m0-schelet-rn` (`c007736`), iar `dev` a avansat prin fast-forward. `git switch` a rescris tot working copy-ul cu CRLF, din cauza `core.autocrlf=true` din configul global Git, iar `prettier --check` a picat pe 43 de fișiere neatinse. Fix-ul durabil e `* text=auto eol=lf` în `.gitattributes` (intră în commitul pasului 2). `Set-Content` din PS 5.1 pune BOM în mesajul de commit, așa că fișierul de mesaj se scrie cu tool-ul Write.

### 2. Tokens complete în `shared/theme`
- `colors.ts`: toată paleta din PROMPT §7 (`bg`, `surface`, `surfaceRaised`, `border`, `divider`, `tabBar`, `text`, `textMuted`, `textRead`, `accent`, `onAccent`, `success`, `successBg`, `danger`, `dangerBorder`, `info`, `cover[]`).
- `spacing.ts`: `space` (4, 8, 12, 16, 20, 24) + aliasuri semantice (`screenPadding: 20`, `cardGap: 16`).
- `radius.ts`: 6, 8, 12, 14, 16, 20, `pill`, cu aliasuri (`coverSm`, `input`, `button`, `card`).
- `typography.ts`: înlocuiește `fontSize` cu `type.{display,title,body,bodyStrong,caption,overline}` (familie, mărime, `lineHeight`, `letterSpacing`, `textTransform`), păstrând exportul folosit de `ScreenPlaceholder` sau migrându-l.
- `sizes.ts`: `touchTarget: 44`, `playButton: 76`, `icon.{sm,md,lg}`, `tabBarHeight`, `maxFontScaleHeader: 1.4`.
- `motion.ts`: `duration.highlight: 150`, `opacity.highlight: 0.18`, `opacity.disabled`.
- `contrast.ts`: `relativeLuminance` și `contrastRatio` (funcții pure, WCAG 2.x).
- `coverColor.ts`: `pickCoverColor(id: BookId)` — hash determinist (djb2) modulo `color.cover.length`.
- **Teste:** contrast ≥ 4.5:1 pentru `text`, `textMuted`, `textRead`, `danger`, `success`, `accent` pe `bg` și `surface`, și `onAccent` pe `accent`; `pickCoverColor` stabil și distribuit pe toate cele 3 culori; tokens fără valori `undefined`.

**Făcut** (2026-11-19). Ce am constatat: toate perechile trec de 4.5:1, inclusiv `textRead` / `textMuted` / `info` pe `tabBar`, `text` și `textMuted` pe `surfaceRaised`, `success` pe `successBg` și `text` pe cele 3 culori de copertă. Riscul despre `textRead` nu s-a confirmat. Exportul se numește `type` (ca în PROMPT), iar TS îl acceptă în `import { type }`. Tokens în plus față de plan: `radius.coverLg` / `cardLg`, `size.buttonLg`, `progressBar`, `coverSm` / `coverLg`, `emptyStateIcon`, `switch`, `opacity.pressed`. `type.title` folosește Space Grotesk Bold, pentru că SemiBold nu există. djb2 e scris fără operatori pe biți (regula `no-bitwise` din configul RN).

### 3. `ThemeProvider`, `useTheme`, integrarea în app
- `shared/theme/ThemeProvider.tsx` + `useTheme()` (context cu obiectul `theme`; aruncă eroare în afara providerului).
- `AppProviders`: adaug `ThemeProvider`. `NavigationContainer` primește o temă derivată din tokens (`navigationTheme.ts` în `app/navigation`), în locul temei provizorii.
- `StatusBar barStyle="light-content"` cu fundal `color.bg` (notat în M0 pasul 6).
- `ScreenPlaceholder` trece pe noile tokens (rezolvă textul negru pe negru din M0).
- **Teste:** `useTheme` întoarce token-urile; aruncă în afara providerului; `App` randează cu providerul.

**Făcut** (2026-11-19). Ce am constatat: în RN 0.88 `StatusBar` nu mai are `backgroundColor` (edge-to-edge pe Android), deci e doar `barStyle="light-content"`, iar fundalul îl dă `GestureHandlerRootView`, cu `color.bg`. `theme.ts` adună toate token-urile într-un obiect, iar `ThemeProvider` îl expune prin context. Stilurile rămân statice. `navigationTheme` păstrează fonturile din `DarkTheme` și are un test propriu. `renderHook` e asincron în Testing Library v14, iar eroarea din afara providerului se prinde cu `await expect(async () => …).rejects`.

### 4. Regulă ESLint locală „max 7 props”
- Plugin local în `eslint.config.js` (`local/max-props`): numără membrii tipului `*Props` din `*.types.ts` / parametrul destructurat al componentei; prag 7 (skill §2).
- Santinelă nouă în `__tests__/lint/architecture-rules.test.ts` (fixture cu 8 props → eroare, 7 → ok).
- **Verificare:** `npm run lint` raportează fixture-ul; restul codului trece.

### 5. Fundații: `AppText` și `Icon`
- Structura fiecărei primitive (skill §4): `shared/ui/<Nume>/{<Nume>.tsx, .styles.ts, .types.ts, use<Nume>.ts (doar dacă are logică), <Nume>.test.tsx, index.ts}`, exportată din `shared/ui/index.ts`.
- `AppText`: `variant`, `color` (cheie de token, nu hex), `maxFontSizeMultiplier` implicit 1.4 pentru `display`/`title`; `accessibilityRole="header"` opțional.
- `Icon`: `name` dintr-o hartă tipizată de iconițe Lucide folosite în machete (`book`, `headphones`, `sliders-horizontal`, `plus`, `play`, `pause`, `check`, `circle`, `chevron-left`, `chevron-down`, `more-horizontal`, `bookmark`, `moon`, `rotate-ccw`, `rotate-cw`, `skip-back`, `skip-forward`, `file-headphone`, `search`, `settings`), `size` din `sizes.icon`, `color` din tokens. Decorativă implicit (`accessible={false}`).
- **Teste:** variantă → stil corect; limita de font scaling; iconița randează și e ascunsă de accesibilitate.

### 6. Primitive interactive: `Button`, `IconButton`, `Chip`, `ChipGroup`, `Switch`
- `Button`: variante `primary | secondary | ghost | danger`, `size` (`md`, `lg` pentru CTA-uri pill ca „Importă primul PDF” / „Continuă de la pagina 34”), `icon` opțional, `loading`, `disabled`; `accessibilityRole="button"`, `accessibilityState={{ disabled, busy }}`, `minHeight: touchTarget`.
- `IconButton`: `icon`, `accessibilityLabel` **obligatoriu** în tip, `hitSlop` până la 44 pt, variantă `filled` pentru play-ul de 76 pt.
- `Chip`: `label`, `selected`, `onPress` opțional (chip de metadate necliclabil vs. filtru); rol `button` + `selected` în stare.
- `ChipGroup<T>`: `options`, `value`, `onChange`, rol `radiogroup`/`radio`; logică în `useChipGroup`.
- `Switch` propriu (macheta are thumb închis pe șină chihlimbar, imposibil cu `Switch` din RN): `Pressable` + Reanimated (`withTiming` 150 ms), rol `switch`, `accessibilityState={{ checked }}`.
- **Teste:** fiecare variantă randează; `onPress` / `onChange` apelate cu `await fireEvent.press`; `disabled` blochează apăsarea; stările de accesibilitate.

### 7. Primitive de afișare: `Card`, `ProgressBar`, `ListRow`, `BookCover`, `EmptyState`, `ScreenHeader`
- `Card`: `surface`, `radius.card`, padding din tokens; varianta `raised`.
- `ProgressBar`: `value` 0–1 (limitat), `tone` (`accent | success | info`), șină `border`; rol `progressbar` cu `accessibilityValue={{ min: 0, max: 100, now }}`.
- `ListRow`: `title`, `subtitle?`, `leading?`, `trailing?` (slot: Switch, text, iconiță), `onPress?`, `divider`; ținta ≥ 44 pt; când are `onPress`, rol `button`.
- `BookCover`: `id`, `title`, `author`, `size` (`sm | lg`); culoarea din `pickCoverColor`; autor sus, titlu jos (macheta „Detalii carte”); `accessibilityLabel` compus din i18n.
- `EmptyState`: `icon` în cerc `surface`, `title`, `description`, `action?` (un `Button`), `note?` (macheta „Bibliotecă goală”).
- `ScreenHeader`: variante `large` (titlu display „Biblioteca mea” / „Setări” + acțiune dreapta) și `compact` (back, supratitlu + titlu centrat, acțiune dreapta — macheta Player/Detalii); safe-area sus; titlul cu rol `header` și `maxFontSizeMultiplier` 1.4.
- **Teste:** render, slot-uri, clamp la `ProgressBar`, culoare determinist la `BookCover`, acțiunea din `EmptyState`, back din `ScreenHeader`.

### 8. `Slider`
- Wrapper peste `@react-native-community/slider` cu culori din tokens (`accent` / `border`), `label`, `valueLabel` (ex. „1.0×”, „Normal” — macheta Setări), `step`, `onChange` / `onComplete`; `accessibilityLabel` + `accessibilityValue`.
- Mock în `jest.setup.js` pentru slider (componentă nativă).
- **Teste:** propagă `value` / `onComplete`; eticheta și valoarea afișată.

### 9. `BottomTabBar` și înlocuirea tab bar-ului
- `shared/ui/BottomTabBar`: primește `items: { key, label, icon, focused, onPress }[]` (fără tipuri React Navigation în `shared`); fundal `tabBar`, activ `accent`, inactiv `textMuted`; rol `tab`, `selected`; safe-area jos.
- Adaptor în `app/navigation/TabBarAdapter.tsx` care mapează `BottomTabBarProps` → `items` (iconițele `book`, `headphones`, `sliders-horizontal`), folosit în `TabsNavigator` prin `tabBar`.
- **Teste:** în `RootNavigator.test.tsx`, apăsarea pe „Setări” schimbă tab-ul și elementul activ are `selected`. (Notă: acum tab-urile **vor avea** rolul `tab`, deci se actualizează capcana din `CLAUDE.md`.)

### 10. `shared/utils`: formatare
- `formatBytes.ts` (`1,2 MB`, `8,9 MB`, `512 KB`), `formatDuration.ts` (`~ 1 h 52 min`, `12 min`, `< 1 min`), `formatPercent.ts` (`41%`, clamp 0–100). Unitățile și sufixele vin din `ro.json` (`format.*`) sau sunt parametri, ca funcțiile să rămână pure.
- **Teste** table-driven: 0, limite de unitate, rotunjire, valori negative/NaN.

### 11. Catalog vizual (doar `__DEV__`) și verificare pe emulator
- `src/app/dev/UiCatalogScreen.tsx`, înregistrat în `RootNavigator` doar când `__DEV__`, deep link `abook://dev/ui`: toate primitivele în toate variantele, pentru comparare cu machetele.
- **Verificare:** `npm run emu`, apoi `adb shell am start -d abook://dev/ui`; capturi comparate cu `01-biblioteca-goala.png`, `03-detalii-carte.png`, `05-setari.png` (tab bar, butoane, chips, switch, slider, copertă, empty state). TalkBack pornit pe catalog: fiecare control își anunță rolul și eticheta în română.

### 12. Închidere
- Checklist `modular-architecture` §10, rezumatul (unități noi / refolosite / `arch-exception`), actualizarea `PLAN.md` (M1 ✅) și a `CLAUDE.md` (capcane noi).

## Definition of done – M1

- [ ] Toate token-urile din PROMPT §7 există în `shared/theme`; zero hex în afara lui (lint).
- [ ] Testul de contrast trece (≥ 4.5:1 pentru toate perechile text/fundal folosite).
- [ ] Cele 13 primitive din PROMPT + `AppText` și `Icon` există, fiecare cu folder complet și teste (render, interacțiune, accesibilitate).
- [ ] Fiecare control are rol, stare și etichetă în română; ținte ≥ 44 pt; header-e limitate la 1.4×.
- [ ] Regula „max 7 props” e activă și dovedită de o santinelă.
- [ ] Tab bar-ul propriu e folosit în app și verificat pe emulator; bara de stare e luminoasă.
- [ ] `formatBytes`, `formatDuration`, `formatPercent` testate.
- [ ] `npm run check` verde; câte un commit per pas.

## Riscuri M1

| Risc | Mitigare |
| --- | --- |
| `textRead` (#8A9099) sau `textMuted` sub 4.5:1 pe `surfaceRaised` | testul o arată; se folosesc doar pe `bg`/`surface`, sau se ajustează tokenul și se semnalează |
| Mock-ul Reanimated nu acoperă animația `Switch` | testăm starea și accesibilitatea, nu animația; animația se verifică pe emulator |
| `@react-native-community/slider` fără mock oficial pentru Jest | mock manual în `jest.setup.js` |
| Regula ESLint locală pentru props e fragilă pe tipuri complexe (intersecții, generice) | numără doar literalele de tip / interfețele `*Props`; restul rămân la review |
| `lucide-react-native` ESM în Jest | e deja în `ESM_PACKAGES`; se verifică la primul test cu `Icon` |

