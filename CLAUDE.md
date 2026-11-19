# ABook – Audiobook PDF

Aplicație React Native (TypeScript strict) care importă un PDF de pe telefon, extrage textul local și îl citește cu voce tare (TTS de sistem), frază cu frază. **Doar frontend, complet offline, interfață în română.**

## Surse de adevăr (citește-le înainte de cod)

| Fișier                    | Conținut                                                                                  |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| `.claude/PROMPT.md`       | cerințele complete: stack, arhitectură, model de date, import PDF, player, ecrane, tokens |
| `.claude/PLAN.md`         | milestone-urile M0–M7, deciziile luate, riscurile                                         |
| `.claude/plans/M<N>-*.md` | pașii fiecărui milestone și ce s-a constatat la fiecare pas                               |
| `.claude/design/*.png`    | machetele ecranelor (Biblioteca cu cărți lipsește)                                        |

## Reguli obligatorii

- **React Native CLI, fără Expo.** Niciun pachet `expo*`; ESLint îl blochează. Nativul (`android/`, `ios/`) se modifică direct, nu prin config plugins.
- **Skill-ul `modular-architecture` se aplică la orice schimbare** (limite de mărime, straturi, feature modules, teste, definition of done). Când promptul intră în conflict cu skill-ul, câștigă skill-ul, iar conflictul se semnalează.
- **Încarcă skill-ul potrivit înainte de cod:** `audiobook-storage` (persistență), `pdf-import-pipeline` (import), `tts-playback-engine` (player). Folosește copiile din `.claude/skills/`, aliniate la RN CLI. Copiile din cont (`anthropic-skills:*`) pomenesc încă Expo.
- **Fiecare pas se încheie cu `npm run check` verde** și cu un commit separat. Planul pasului se actualizează cu ce s-a constatat.

## Comenzi

```bash
npm run check          # typecheck + lint + prettier --check + jest (trebuie să fie verde)
npm test               # doar Jest
npm run emu            # emulator + Metro + build doar la schimbări native + pornire app
npm run emu -- -SkipBuild | -EmulatorOnly | -ForceBuild | -ResetCache
npm run emu:rebuild    # build forțat + cache Metro curățat
npx react-native-asset # după ce adaugi un font în assets/fonts
```

`npm run emu` rulează `.claude/scripts/run-android.ps1`. Log-urile sunt în `android/build/run-android/`. Codurile de ieșire: 1 SDK/AVD/JDK, 2 emulatorul a murit, 3 timeout la boot, 4 Metro, 5 build, 6 app nu e în prim-plan.

## Structura și straturile

```
src/app/           navigation/ (RootStack + Tabs, linking abook://), providers/, App.tsx
src/features/<f>/  library, import, book, player, settings; doar index.ts e public
src/services/      pdf, text, tts (fără Redux, fără UI)
src/repositories/  interfețe + implementări Local*; singurele, cu storage/, care ating stocarea
src/storage/       adaptoare AsyncStorage / react-native-fs, chei, migrări
src/shared/        ui (primitive), theme (tokens), i18n (ro.json), domain (BookId…), utils
```

Dependențele merg doar în jos: `app → features → services → repositories → storage`, iar `shared` e disponibil tuturor. `eslint-plugin-boundaries` impune:

- între feature-uri, importurile trec doar prin `index.ts`;
- feature-urile importă din `repositories` doar tipuri;
- importurile circulare sunt interzise.

Testele din `__tests__/lint/` dovedesc că regulile sunt active. Dacă schimbi `eslint.config.js`, actualizează și testele.

Alte reguli impuse de lint: nicio culoare hex în afara `src/shared/theme`, AsyncStorage și FS doar în `src/storage` și `src/repositories`, fără `any` și fără `!`.

Branch-uri: `main` ← `dev` ← `m<N>-<nume>` (de exemplu `m0-fundatie`, `m0-schelet-rn`). Push și PR doar la cerere.

## Capcane descoperite în M0 (nu le redescoperi)

- **JDK:** RN 0.88 acceptă JDK 17–20, iar `JAVA_HOME` de pe acest PC e 25. Scriptul alege JDK 17 doar pentru build. Pentru Gradle manual: `$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"` și `.\gradlew.bat` (cu `.\`).
- **TTS:** `react-native-tts` nu compilează cu Gradle 9 (`jcenter()`). Vocea va fi un TurboModule propriu, `AbookTts`, în M5.
- **AsyncStorage 3.x:** folosește Room/SQLite și API-ul `getMany` / `setMany` / `removeMany` (nu `multiGet`). Nu are `AsyncStorage_db_size_in_MB`. Valorile rămân sub ~256 KB, pentru că limita `CursorWindow` la citire e de 2 MB.
- **Testing Library v14:** `render`, `renderHook` și `fireEvent.*` sunt asincrone, deci se folosesc cu `await`. Tab-urile (`BottomTabBar` propriu, din M1) au rolul `tab` și starea `selected`.
- **ESLint 9:** pluginul `ft-flow` din configul RN e scos, pentru că se blochează. `import/no-cycle` merge cu `disableScc: true`. În Jest, ESLint primește configul prin `overrideConfig`, fiindcă ESLint 9 îl încarcă prin `import()` dinamic, iar Jest nu suportă asta.
- **Pachete ESM în Jest:** se adaugă în `ESM_PACKAGES` din `jest.config.js`. Mock-urile native sunt în `jest.setup.js`.
- **Tipuri Node:** codul aplicației nu le vede. Testele care folosesc `fs`/`path` încep cu `/// <reference types="node" />` și `@jest-environment node`.
- **Fonturi:** fișierele poartă numele PostScript (`Inter-Regular`, `SpaceGrotesk-Bold`…), deci `fontFamily` e același pe ambele platforme. Space Grotesk nu are SemiBold static. Un font nou cere `npx react-native-asset`, iar `__tests__/fonts` verifică legarea.
- **Splash:** se regenerează cu `npx react-native-bootsplash generate assets/brand/splash-logo.svg --platforms=android,ios --background=111316 --logo-width=96`. Generatorul rescrie `AndroidManifest.xml`; verifică după aceea comentariile și intent-filter-ul `abook://`.
- **Manifest Android:** `INTERNET` există doar în `src/debug`, iar `src/release` scoate permisiunile de rețea. `__tests__/native` păzește regula.
- **Commit din PowerShell 5.1:** mesajele cu ghilimele duble se strică în here-string. Scrie mesajul într-un fișier și folosește `git commit -F <fișier>`. Scrie fișierul cu tool-ul Write, nu cu `Set-Content`, care pune BOM în mesaj.

## Capcane descoperite în M1

- **Line endings:** `core.autocrlf=true` din Git-ul global rescria working copy-ul cu CRLF la fiecare `git switch`, iar `prettier --check` pica pe tot repo-ul. `.gitattributes` are acum `* text=auto eol=lf`; nu scoate `eol=lf`.
- **Reanimated 4.7 în Jest:** mock-ul oficial (`react-native-reanimated/mock`) crapă la import, pentru că `setCSSEventHandler` aruncă în JSReanimated. `jest.setup.js` are un mock manual minim; extinde-l când folosești un API Reanimated nou.
- **Lucide în Jest:** Jest rezolvă `lucide-react-native` la build-ul `.mjs`, pe care transformul RN îl sare. `moduleNameMapper` îl trimite la `dist/cjs`. În Lucide 1.75, `MoreHorizontal` se numește `Ellipsis`.
- **`StatusBar` în RN 0.88:** nu mai are `backgroundColor` (edge-to-edge). Fundalul îl dă root view-ul, cu `color.bg`.
- **Roluri de grup:** un container `radiogroup` sau `tablist` rămâne neaccesibil (altfel TalkBack înghite copiii), deci `getByRole('radiogroup')` nu-l găsește. Caută-l după etichetă și verifică `props.accessibilityRole`.
- **Regula `local/max-props`** (≤ 7, în `eslint-rules/max-props.js`): numără membrii proprii ai tipurilor `*Props` și proprietățile destructurate ale componentelor PascalCase. Grupează prop-urile înrudite într-un obiect (ex. `Slider.range`, `ScreenHeader.back`).
- **Primitivele nu știu i18n:** primesc texte deja traduse, inclusiv etichetele de accesibilitate (ex. `BookCover.accessibilityLabel`). Unitățile pentru `formatBytes` / `formatDuration` vin din `ro.json` → `format.*`, ca parametru.
- **Catalogul UI:** `abook://dev/ui` (doar `__DEV__`), cu toate primitivele. Pentru verificarea accesibilității pe emulator: `adb shell uiautomator dump /sdcard/ui.xml` (etichete, `checked`, `selected`, `enabled`, dimensiuni).
- **Capturi de ecran din PowerShell:** `adb exec-out screencap -p > f.png` strică PNG-ul (encoding). Folosește `adb shell screencap -p /sdcard/x.png` + `adb pull`.
- **`npm run check` cu emulatorul și Metro pornite** e mult mai lent (`eslint .` ~90 s); rulează-l în fundal, cu ieșirea într-un fișier, nu printr-un pipe care bufferează.
