# M0 – Fundație și unelte (React Native CLI)

Branch: `m0-fundatie` (din `dev`). La final: PR `m0-fundatie` → `dev`.
Referințe: `.claude/PLAN.md` (M0), `.claude/PROMPT.md` §2, §3 și §8 pasul 1, skill-ul `modular-architecture` §2, §3 și §10.

**Platformă: React Native CLI pur. Fără Expo**: nici SDK, nici pachete `expo-*`, nici `install-expo-modules`. Lint-ul interzice orice import `expo*`.

## Obiectiv

Un proiect React Native CLI care pornește pe emulatorul `Pixel_10_Pro_XL` prin `.claude/scripts/run-android.ps1`. Are 3 tab-uri goale și fonturile încărcate, iar `typecheck`, `lint` și `test` sunt verzi. Regulile de arhitectură sunt deja impuse de lint, înainte să existe cod de business.

## Mediu verificat (2026-11-18)

| Unealtă | Versiune | Notă |
| --- | --- | --- |
| Node / npm | 24.13.0 / 11.6.2 | ok |
| React Native | 0.88.1 (`@react-native-community/cli` 21.0.0) | ultimul stabil |
| Android SDK | `%LOCALAPPDATA%\Android\Sdk` | AVD `Pixel_10_Pro_XL` |
| JDK | `JAVA_HOME` = 25; există și 17 (Adoptium) | Se verifică ce JDK cere RN 0.88 (pasul 2). Dacă e 17, scriptul setează `JAVA_HOME` doar pentru build |

## Echivalențe Expo → RN CLI (aplicate în PROMPT §2)

| Nevoie | Înainte (Expo) | Acum (RN CLI) | Versiune |
| --- | --- | --- | --- |
| Navigare | `expo-router` | `@react-navigation/native` + `native-stack` + `bottom-tabs` | 7.5 / 7.21 / 7.22 |
| Fișiere | `expo-file-system` | `@dr.pogodin/react-native-fs` | 2.41 |
| Alegere PDF | `expo-document-picker` | `@react-native-documents/picker` | 12.1 |
| Voce | `expo-speech` | `react-native-tts` (rezervă: TurboModule propriu) | 4.1.1 |
| UUID / hash | `expo-crypto` | `react-native-get-random-values` + `uuid`, `@noble/hashes` | 2.1 / – / 2.4 |
| Partajare | `expo-sharing` | `react-native-share` | 12.3 |
| Splash | `expo-splash-screen` | `react-native-bootsplash` | 7.3 |
| Fonturi | `expo-font` + `@expo-google-fonts/*` | `.ttf` în `assets/fonts`, legate cu `react-native-asset` | – |
| Config native | config plugins | modificări directe în `android/` și `ios/` | – |
| Teste | `jest-expo` | Jest cu preset `react-native` | – |

## Presupuneri (de confirmat; nu blochează începutul)

- Deciziile 1–4 din `PLAN.md` („Conflicte de semnalat”) se aplică așa cum au fost propuse.
- Numele proiectului nativ este `ABook`, cu pachetul / bundle id `com.abook` și numele afișat „Audiobook PDF”.
- Managerul de pachete este `npm`.
- Lucrez doar pe Android pe Windows. Folderul `ios/` se generează și se ține în repo, dar build-ul iOS (pod install, Xcode) nu se poate verifica aici.

---

## Pași

Fiecare pas se încheie cu un commit pe `m0-fundatie`. De la pasul 4 încolo, fiecare commit trece `typecheck`, `lint` și `test`.

### 1. Commit de pornire
- Adaug `.claude/` (PROMPT, PLAN, plans, skills).
- **Verificare:** `git status` curat.

### 2. Schelet React Native CLI
**Făcut** (2026-11-18). Ce am constatat:
- RN 0.88.1 cere JDK între 17 și 20 (`react-native doctor`). Scriptul folosește automat JDK 17.
- Template-ul a generat `com/com.abook/`; am mutat fișierele în `com/abook/`. Am setat `rootProject.name` la `ABook` și numele afișat la „Audiobook PDF”.
- TS 6 marchează `baseUrl` ca depreciat, așa că `paths` e folosit fără el.
- `doctor` raportează „Android SDK N/A”, deși build-tools 37 e instalat și build-ul trece. E o eroare de detecție a lui `doctor`.
- Build-ul de debug primește `ACCESS_LOCAL_NETWORK` de la dev support-ul RN (Android 17 îl cere la rulare). `run-android.ps1` îl acordă pe emulator.
- Primul build a durat 135 s. A doua rulare a scriptului nu face build și durează 9 s.

- `npx @react-native-community/cli@latest init ABook --package-name com.abook --skip-git-init`, generat într-un folder temporar (rădăcina nu e goală), apoi mutat în rădăcină. Rămân `README.md` și `.claude/`, iar `.gitignore` vine din template.
- Verific în `android/gradle.properties` că `newArchEnabled=true`, și îl activez și pe iOS.
- Afișez numele „Audiobook PDF”: `android/app/src/main/res/values/strings.xml` și `CFBundleDisplayName` în `Info.plist`.
- `tsconfig.json`: `strict: true`, `noUncheckedIndexedAccess`, `noImplicitOverride`, alias-ul `@/*` → `src/*`, oglindit în `babel-plugin-module-resolver`.
- Verific ce JDK cere RN 0.88 (documentația „Set up your environment”).
- Șterg `App.tsx` demo; punctul de intrare devine `src/app/App.tsx`.
- **Verificare:** `npx tsc --noEmit` trece; `npx react-native doctor` fără erori pe Android.

### 3. Dependențe (toate cele native, o singură dată)
**Rezultat** (2026-11-18):
- **Spike `react-native-tts`: EȘUAT.** Biblioteca nu compilează, pentru că `build.gradle` folosește `jcenter()`, care a fost eliminat în Gradle 9 (RN 0.88 folosește Gradle 9.4.1). Am scos-o. Vocea devine un **TurboModule propriu** (`AbookTts`: Android `TextToSpeech`, iOS `AVSpeechSynthesizer`) în M5, în spatele `TtsEngine`.
- **AsyncStorage 3.1.1:** folosește Room/SQLite și are un API nou (`getMany` / `setMany` / `removeMany`, `getAllKeys`, `createAsyncStorage(name)`), fără `multiGet` și fără proprietatea `AsyncStorage_db_size_in_MB`, deci limita de ~6 MB din v1 nu mai există. Regula de ~256 KB per valoare rămâne, din cauza limitei de 2 MB a `CursorWindow` la citire. Pasul 7 nu mai are nimic de setat pentru AsyncStorage.
- **`pdfjs-dist` 6.5.438:** are `legacy/build/pdf.mjs` și `pdf.worker.mjs`.
- Toate versiunile sunt fixate exact în `package.json`, iar `.npmrc` are `save-exact=true`.

Instalez acum toate librăriile native, ca build-ul nativ să se facă rar și scriptul să nu mai recompileze la fiecare milestone.

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

- Pentru fiecare librărie nativă, verific în documentația ei compatibilitatea cu RN 0.88 și New Architecture, apoi fixez versiunea. Reanimated cere plugin-ul Babel (pentru Reanimated 4: `react-native-worklets/plugin`).
- Pentru `pdfjs-dist` fixez o versiune care are build-ul legacy (folosit în M3).
- Fără `redux-persist`, fără kit-uri UI și fără `expo*` (PROMPT §2).
- **Spike `react-native-tts`:** build Android, plus un test manual de `speak`/`stop` din ecranul placeholder. Dacă nu compilează sau nu emite evenimente pe New Architecture, notez în `PLAN.md` și planific TurboModule-ul propriu pentru M5, fără să blochez M0.
- **Verificare:** `cd android && gradlew assembleDebug` trece.

### 4. Calitate: TypeScript, ESLint, Prettier, Jest
**Făcut** (2026-11-19). `npm run check` (typecheck, lint, Prettier, Jest) e verde, cu 20/20 teste, dintre care 19 sunt santinele de lint. Abateri față de plan:
- **ESLint 9.39** cu flat config (`eslint.config.js`), peste `@react-native/eslint-config/flat`. Fără pachetul `typescript-eslint`: pluginul `@typescript-eslint` e deja inclus de configul RN, iar al doilea ar fi fost o definiție duplicată. Regulile `no-explicit-any` și `no-non-null-assertion` sunt setate explicit.
- `eslint-plugin-ft-flow` (venit din configul RN) cade pe ESLint 9 (`getAllComments`). Nu folosim Flow, așa că i-am scos regulile.
- `eslint-plugin-boundaries` 7.4 folosește regula `boundaries/dependencies` cu `policies`. Între feature-uri, importurile sunt permise doar spre `index.ts` (`fileInternalPath`) sau în interiorul aceluiași feature (`captured.feature`). Spre repositories, feature-urile au voie doar la importuri de tip.
- `import/no-cycle` merge cu `disableScc: true`: optimizarea SCC cade pe fișiere care nu există pe disc.
- Santinelele dau configul direct prin `overrideConfig`, pentru că ESLint 9 îl încarcă prin `import()` dinamic, nesuportat de VM-ul Jest. Fișierele-țintă se creează temporar în `__lint-fixtures__` și se șterg la final.
- Tipurile Node (`@types/node`) se încarcă doar în testul de lint (`/// <reference types="node" />`); codul aplicației nu le vede.
- Am creat deja aici scheletul `src/` cu `index.ts`, din pasul 5, ca santinelele să aibă ținte reale.

- **Scripturi** în `package.json`: `typecheck` (`tsc --noEmit`), `lint` (`eslint .`), `format`, `test` (`jest`), `check` (toate trei).
- **ESLint** (flat config: `@react-native/eslint-config` + `typescript-eslint` strict + `eslint-config-prettier`):
  - `@typescript-eslint/no-explicit-any`, `no-non-null-assertion`: `error`;
  - limitele din skill §2:

    | Glob | Reguli |
    | --- | --- |
    | `**/components/**/*.tsx`, `src/shared/ui/**/*.tsx` | `max-lines` 150 |
    | `**/screens/**/*.tsx` | `max-lines` 120 |
    | `**/hooks/**/use*.ts` | `max-lines` 80 |
    | `src/services/**`, `**/services/**`, `src/shared/utils/**` | `max-lines` 200, `max-lines-per-function` 40 |
    | toate fișierele | `max-params` 3, `complexity` 10, `max-depth` 4, `react/jsx-max-depth` 4 |

  - regula de max 7 props nu există gata făcută; o verific în review și, dacă devine nevoie, scriu o regulă locală în M1;
  - interdicții (`no-restricted-imports`):
    - `expo`, `expo-*` și `@expo/*` peste tot;
    - `@react-native-async-storage/async-storage` și `@dr.pogodin/react-native-fs` în afara `src/storage/**` și `src/repositories/**`;
    - hex-uri literale în afara `src/shared/theme/**` (`no-restricted-syntax` pe `/#[0-9a-fA-F]{3,8}/`).
- **`eslint-plugin-boundaries`**, cu elementele `app`, `feature`, `service`, `repository`, `storage`, `shared` și regulile:
  - `app` → orice;
  - `feature` → `service`, `shared` și alt `feature` doar prin `index.ts`;
  - `service` → `shared`;
  - `repository` → `storage`, `shared`;
  - `storage` → `shared`;
  - `shared` → `shared`;
  - în plus, `import/no-cycle`.
- **Jest:** preset `react-native`, `@testing-library/react-native`, `jest.setup.ts` cu mock-urile oficiale (AsyncStorage, Reanimated, gesture-handler, safe-area, bootsplash) și `transformIgnorePatterns` pentru pachetele ESM (`@react-navigation`, `lucide-react-native`, `@noble/hashes`, `uuid`).
- **Teste de santinelă** pentru reguli: fișiere fixture care încalcă intenționat `boundaries` și `no-restricted-imports` (inclusiv un import `expo-*`), rulate cu `ESLint` din API într-un test Jest, care verifică că regulile raportează erorile.
- **Verificare:** `npm run check` verde.

### 5. Structura `src/` și navigația
- Folderele din PROMPT §3, fiecare cu un `index.ts` minim, ca regulile `boundaries` să aibă ce verifica:
  - `src/features/{library,import,book,player,settings}` (fiecare cu un `screens/` placeholder);
  - `src/services/{pdf,text,tts}`, `src/repositories`, `src/storage/migrations`;
  - `src/shared/{ui,theme,i18n,domain,utils}`.
- `src/app/navigation/`:
  - `types.ts`: `RootStackParamList` (`Tabs`, `Import`, `Book: { id: BookId }`), `TabsParamList` (`Library`, `Player`, `Settings`) și declarația globală `ReactNavigation.RootParamList`, pentru `navigation.navigate` tipat;
  - `RootNavigator.tsx`: native stack, cu `Import` ca `presentation: 'modal'`;
  - `TabsNavigator.tsx`: bottom tabs (tab bar-ul implicit acum; `BottomTabBar` propriu vine în M1);
  - `linking.ts`: schema `abook://` (`book/:id`, `import`).
- Navigatoarele înregistrează doar ecranele exportate din `features/<f>/index.ts` (decizia 4).
- **Teste:** navigatorul randează tab-ul Bibliotecă; `navigate('Book', { id })` ajunge pe ecranul de detalii.

### 6. Providers, fonturi, splash, i18n
- `src/shared/i18n/ro.json` (titlurile tab-urilor și ale ecranelor placeholder) și `src/app/providers/I18nProvider.tsx`; niciun text hard-codat.
- `src/app/providers/AppProviders.tsx` compune `GestureHandlerRootView`, `SafeAreaProvider`, `I18nProvider` și `NavigationContainer` (cu `linking` și o temă întunecată provizorie). `StoreProvider` și `ThemeProvider` se adaugă în M1 și M2, ca sloturi.
- Fonturi:
  - descarc Inter (400/600) și Space Grotesk (600/700) ca `.ttf` în `assets/fonts/` (licență OFL, inclusă în `assets/fonts/LICENSE`);
  - le leg cu `react-native.config.js` (`assets: ['./assets/fonts']`) și `npx react-native-asset`;
  - verific numele PostScript ca `fontFamily` să fie identic pe Android și iOS.
- Splash: `react-native-bootsplash generate` cu culoarea de fundal `#111316` (singura culoare definită în afara tokens, în configul nativ) și `BootSplash.hide()` după montarea navigației. În M2, `hide()` așteaptă și `bootstrap.ts`.
- **Teste:** render pe `AppProviders` cu un copil; tab-urile afișează cele 3 etichete în română.

### 7. Setări native directe
- `android/gradle.properties`: `AsyncStorage_db_size_in_MB`. **Întâi** verific în documentația versiunii de AsyncStorage instalate dacă proprietatea se mai numește așa (v2/v3 pot diferi). Dacă nu se mai aplică, notez în `PLAN.md` și păstrez riscul pentru M2.
- `ios/ABook/Info.plist`: `UIBackgroundModes` = `audio`.
- `AndroidManifest.xml`: fără permisiunea `INTERNET` în build-ul de release. Rămâne în `src/debug/` pentru Metro, ca garanție pentru „fără rețea la rulare”.
- **Verificare:** build Android trece; proprietățile apar în fișierele native.

### 8. `.claude/scripts/run-android.ps1`
**Scris deja** (2026-11-18). Sintaxa e verificată, iar fără proiect iese corect cu codul 1. Rămâne de verificat cu proiectul real, după pasul 2. Scriptul din `techspeak` e tot pentru RN CLI, deci l-am copiat și am schimbat puțin:

| În techspeak | În ABook |
| --- | --- |
| `$ProjectRoot` = `..\..\app` | `..\..` (rădăcina repo-ului) |
| `com.techspeak` / `com.techspeak.MainActivity` | `com.abook` / `com.abook.MainActivity` |
| `yarn` cu fallback `npx` | `npm run start` / `npx react-native run-android` (fără yarn) |
| Amprenta nativă: `android/**`, `package.json`, `yarn.lock` | `android/**`, `package.json`, `package-lock.json` |
| `JAVA_HOME` moștenit | setat pe JDK-ul cerut de RN 0.88 doar pentru procesul de build, dacă diferă de cel curent |
| Dialogul de permisiune microfon (pasul 8) | eliminat (ABook nu cere microfon) |

- Restul rămâne: pașii 1–8, codurile de ieșire 0–6, log-urile în `android\build\run-android\`, repararea ferestrei din afara ecranului, cold boot automat, avertizarea pentru Metro duplicat.
- **Verificare:** prima rulare face build și deschide aplicația. A doua rulare, fără schimbări native, doar repornește aplicația. Rularea cu `-ForceBuild -ResetCache` funcționează.

### 9. `CLAUDE.md`
- Un fișier scurt în rădăcină, care trimite la `.claude/PROMPT.md`, `.claude/PLAN.md` și `.claude/plans/`.
- Regulile principale:
  - React Native CLI, **fără Expo**;
  - skill-urile se încarcă înainte de codul de stocare, import sau player;
  - comenzile `npm run check` și `run-android.ps1`;
  - convenția de branch-uri: `m<N>-<nume>` din `dev`.

### 10. Închidere
- `npm run check` verde, apoi `run-android.ps1` deschide aplicația cu tab-urile Bibliotecă / Player / Setări.
- Bifez checklist-ul din `modular-architecture` §10 și scriu rezumatul: unități noi, unități refolosite, `arch-exception` (niciuna așteptată).
- PR `m0-fundatie` → `dev`, doar la cerere.

## Definition of done – M0

- [ ] Proiect RN CLI 0.88, New Architecture, zero dependențe `expo*` (verificat de lint și de `npm ls`)
- [ ] Aplicația pornește pe `Pixel_10_Pro_XL` printr-o singură comandă (`run-android.ps1`)
- [ ] 3 tab-uri + `Import` (modal) și `Book` (`{ id }`), cu `ParamList` tipate și deep links
- [ ] Fonturile Inter și Space Grotesk se încarcă, iar splash-ul dispare doar după montare
- [ ] Toate textele vin din `ro.json`
- [ ] `typecheck`, `lint` și `test` verzi; testele de santinelă dovedesc că `boundaries` și interdicțiile sunt active
- [ ] Toate dependențele native sunt instalate și compilate; spike-ul `react-native-tts` are rezultat notat
- [ ] `CLAUDE.md` scris, iar `.claude/` e în commit

## Riscuri M0

| Risc | Mitigare |
| --- | --- |
| JDK 25 incompatibil cu Gradle/AGP din RN 0.88 | JDK 17 e instalat; scriptul îl setează doar pentru build |
| `react-native-tts` neîntreținut (ultima versiune 2024) pe New Architecture | spike în pasul 3; rezerva e un TurboModule propriu în M5 |
| O librărie nativă nu e încă compatibilă cu RN 0.88 | fixez ultima versiune compatibilă; în cel mai rău caz, RN 0.87 |
| `eslint-plugin-boundaries` nu suportă bine flat config | alternativa din PROMPT: `dependency-cruiser`, rulat în `lint` |
| Proprietatea `AsyncStorage_db_size_in_MB` nu mai există în versiunea instalată | se documentează și se tratează în M2 (eventual text în fișiere) |
| iOS neverificabil pe Windows | `ios/` ținut corect în repo; verificarea iOS se face în M7 pe un Mac |
