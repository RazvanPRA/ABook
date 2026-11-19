# Plan de lucru – Audiobook PDF

Sursa: `.claude/PROMPT.md` (cerințe), skill-urile din `.claude/skills/` (`audiobook-storage`, `pdf-import-pipeline`, `tts-playback-engine`) și skill-ul instalat `modular-architecture`.

**Platformă: React Native CLI, fără Expo** (decizie a utilizatorului, 2026-11-18; `PROMPT.md` §2 și skill-urile din proiect au fost actualizate în consecință).

Branch de lucru: `dev`. Fiecare milestone se închide printr-un commit (sau PR spre `main`) doar după ce:

- `npm run typecheck`, `npm run lint` și `npm test` sunt verzi;
- checklist-ul *Definition of done* din `modular-architecture` (secțiunea 10) e bifat;
- rezumatul listează unitățile noi, cele refolosite și orice `arch-exception`.

## Reguli transversale (se aplică în toate milestone-urile)

| Sursă | Regulă |
| --- | --- |
| `modular-architecture` | Componentă ≤ 150 linii (JSX ≤ 80), ecran ≤ 120, hook ≤ 80, funcție ≤ 40, fișier serviciu ≤ 200, ≤ 7 props, ≤ 3 parametri, JSX ≤ 4 niveluri, complexitate ≤ 10 |
| `modular-architecture` | Dependențe doar în jos: app → features → services → repositories → storage; `shared` e folosit de toți. Între feature-uri doar prin `index.ts` |
| `modular-architecture` | Componentă = folder cu `.tsx`, `.styles.ts`, `.types.ts`, `use*.ts`, `.test.tsx` și `index.ts` |
| `modular-architecture` | Fără hex, magic numbers sau texte hard-codate; doar tokens și i18n |
| `audiobook-storage` | Doar `storage/` și `repositories/` ating AsyncStorage și `@dr.pogodin/react-native-fs`. Cheile se construiesc doar prin `storage/keys.ts` |
| `audiobook-storage` | Validare zod la citire; o valoare invalidă se loghează și e tratată ca lipsă |
| `pdf-import-pipeline` | Parsarea rămâne în WebView; `features/import` orchestrează, nu parsează |
| `tts-playback-engine` | O frază per utterance și token de generație; scrierile de progres nu pleacă din componente |

## Conflicte de semnalat (câștigă skill-ul, conform PROMPT §1)

1. **Locul primitivelor UI.** Exemplele din `modular-architecture` folosesc `src/components/ui`, iar PROMPT folosește `src/shared/ui`. Diagrama de straturi din skill pune însă „ui primitives” chiar în `shared`, deci regula de fond e respectată. **Decizie propusă:** `src/shared/ui`, cu regula de căutare pentru refolosire (skill §6) aplicată pe `src/shared`.
2. **Locul repository-urilor.** Skill-ul le pune în `features/<f>/repository/`, iar PROMPT și `audiobook-storage` le centralizează în `src/repositories/`, pentru că `progress` și `settings` sunt folosite de mai multe feature-uri. **Decizie propusă:** `src/repositories/`, fiindcă skill-ul de stocare e mai specific. Feature-urile văd doar interfețele, prin `app/dependencies.ts`.
3. **Locul schemelor zod.** `audiobook-storage` le cere în `model/schemas.ts` al fiecărui feature, dar repository-urile din stratul inferior nu au voie să importe din feature-uri. **Decizie propusă:** schemele de persistență stau în `src/shared/domain/schemas/`, iar fiecare feature le re-exportă din `model/schemas.ts`.
4. **Stratul `screens`.** Skill-ul are un strat `screens`, iar navigația stă în `src/app/navigation`. **Decizie propusă:** navigatoarele din `src/app/navigation` doar înregistrează ecranele exportate din `features/<f>/index.ts`; ecranele rămân în `features/<f>/screens`.

> Cele patru decizii trebuie confirmate înainte de M0.

---

## M0 – Fundație și unelte  *(PROMPT pasul 1)* — ✅ încheiat 2026-11-19

Rezultatele, abaterile și capcanele sunt în `.claude/plans/M0-fundatie.md` și în `CLAUDE.md`.

**Obiectiv:** un proiect React Native CLI care pornește pe emulator, cu toată infrastructura de calitate activă. Detalii: `.claude/plans/M0-fundatie.md`.

- `@react-native-community/cli init` (RN 0.88), TypeScript `strict`, New Architecture; `android/` și `ios/` în repo.
- React Navigation: RootStack (Tabs, Import modal, Book) + Tabs (Library, Player, Settings), cu `ParamList` tipate.
- Fonturile Inter și Space Grotesk ca `.ttf` legate nativ; `react-native-bootsplash` ținut până la încărcare.
- ESLint (`@react-native/eslint-config` + `typescript-eslint`), Prettier și `eslint-plugin-boundaries` cu regulile de straturi din skill §3. Interdicție pe AsyncStorage/FS în afara `storage/` și `repositories/`, și pe orice import `expo*`.
- Reguli ESLint pentru limite: `max-lines`, `max-params`, `complexity`, `max-depth`.
- Jest (preset `react-native`) și `@testing-library/react-native`; scripturile `typecheck`, `lint` și `test`.
- Setări native directe: `AsyncStorage_db_size_in_MB` în `android/gradle.properties` și `UIBackgroundModes: ["audio"]` în `Info.plist`.
- `i18next` cu `ro.json` și `I18nProvider`.
- **`.claude/scripts/run-android.ps1`**, adaptat din `techspeak` (tot RN CLI, deci modificări mici): proiectul în rădăcină, pachetul ABook, `npm` în loc de `yarn`.

**Gata când:** aplicația se deschide pe emulator prin script, cu 3 tab-uri goale și fonturile încărcate, iar CI-ul local e verde.

## M1 – Design system  *(pasul 2)*

**Obiectiv:** toate primitivele, construite pe tokens și testate, înainte de orice ecran. Detalii: `.claude/plans/M1-design-system.md`.

- `shared/theme`: tokens (culori, `space`, `radius`, `type`) din PROMPT §7, plus `ThemeProvider` și `useTheme`.
- `shared/ui`: `Button` (primary/secondary/ghost/danger), `IconButton`, `Chip`, `ChipGroup`, `Card`, `ProgressBar`, `Switch`, `ListRow`, `Slider`, `BookCover` (culoare deterministă din id), `BottomTabBar`, `ScreenHeader`, `EmptyState`.
- `shared/utils`: formatare de dimensiuni, durate și procente, în fișiere separate pe scop.
- Accesibilitate în contractul fiecărei primitive: rol, stare, etichetă, ținte ≥ 44 pt, font scaling limitat la 1.4× în header-e.

**Teste:** render, interacțiune și stare de accesibilitate pentru fiecare primitivă; un test că tokens au contrast ≥ 4.5:1.
**Gata când:** fiecare primitivă din listă există și e testată, iar tab bar-ul real înlocuiește pe cel implicit.

## M2 – Date și stocare  *(pasul 3, skill `audiobook-storage`)*

- `shared/domain`: `BookId`, `PageNumber`, `SentenceIndex` și schemele zod pentru `BookMeta`, `Chapter`, `ChapterChunk`, `Progress`, `Bookmark`, `Settings`.
- `storage/keys.ts`, `keyValueStore.ts` (multiGet/multiSet/multiRemove, namespacing `abk:`), `fileStore.ts` (API-ul `File`/`Directory`).
- `storage/migrations/` (`001-initial.ts`) și runner-ul de migrări.
- `repositories/`: `BookRepository`, `ProgressRepository`, `SettingsRepository`, fiecare ca interfață + implementare `Local*`. Includ împărțirea capitolelor peste 256 KB în `ch:{n}:p:{k}` și ștergerea pe prefix.
- `app/dependencies.ts`, `app/bootstrap.ts` (migrări, apoi un singur `multiGet` pentru `books` + `meta` + `settings`, apoi marcarea cărților rămase `processing`) și `StoreProvider` cu RTK.

**Teste:** cu `KeyValueStore` și `FileStore` în memorie: ordinea scrierii la import, reluarea după crash, ștergerea fără chei orfane, valori corupte, capitole prea mari, fiecare migrare.
**Gata când:** bootstrap-ul hidratează store-ul dintr-o stocare falsă în teste și dintr-una reală pe emulator.

## M3 – Text și import PDF  *(pașii 4–5, skill `pdf-import-pipeline`)*

**M3a – `services/text`** (funcții pure, câte una per fișier): `stripRepeatedHeaders`, `stripPageNumbers`, `joinHyphenatedWords`, `normalizeDiacritics`, `segmentSentences`, `splitLongSentence`, `detectChapters`.
**Teste** table-driven cu mostre românești: dialog, abrevieri, cratime, sedile, fraze > 400 de caractere, text gol. Țintă: 100% acoperire.

**M3b – `services/pdf`**
- `PdfTextExtractor` (interfață) și `WebViewPdfExtractor`.
- `services/pdf/webview/`: HTML + `pdfjs-dist` legacy cu worker inclus, ca asset local.
- Protocolul `{ type, requestId, payload }`, validat zod pe ambele părți, cu base64 în bucăți de 512 KB, loturi de 5 pagini, timeout și anulare.
- `PdfExtractorHost`, montat o dată și ascuns, fără acces la rețea.

**M3c – `features/import`**
- Mașina de stări `idle | copying | opening | extracting | saving | ready | failed | cancelled`.
- Picker cu limită de 100 MB, amprentă pentru duplicate (`@noble/hashes`), reluare de la `processedPages`.
- Cazurile speciale: PDF scanat, protejat cu parolă, corupt, anulare.
- Ecranul Import: card fișier, pași cu stare, formular titlu/autor/limbă.
- Cartea devine redabilă după primul capitol.

**Teste:** mașina de stări cu un `PdfTextExtractor` fals, pentru fiecare caz de eșec.
**Gata când:** un PDF real de 300+ pagini se importă pe emulator fără ca UI-ul să înghețe.

## M4 – Bibliotecă și detalii carte  *(pașii 6–7)*

- `features/library`: listă `FlashList`, căutare, chips Toate / În curs / Terminate, card „Continuă ascultarea”, FAB „Importă PDF”. Stări: skeleton, goală (ecranul separat „Bibliotecă goală”), fără rezultate, carte în procesare cu bară de import.
- `features/book`: copertă mare, chips de metadate, „Continuă de la pagina N”, cuprins cu stare per capitol, semne de carte, ștergere cu confirmare. Stări: carte în procesare, carte eșuată (reîncearcă). Expune selectorii publici folosiți de player.

**Teste:** slice-uri, selectori memoizați și fiecare stare din tabelul de ecrane.
**Gata când:** după ștergerea unei cărți, ea nu mai lasă chei sau fișiere pe dispozitiv.

## M5 – Voce și player  *(pasul 8, skill `tts-playback-engine`)*

- `services/tts`: `TtsEngine`, `NativeTtsEngine` (peste TurboModule-ul propriu `AbookTts`, cu spec Codegen în `specs/NativeAbookTts.ts`) și `FakeTtsEngine` pentru teste.
- `features/player`:
  - sesiunea de redare cu stările `idle | loading | playing | paused | ended | error`;
  - token de generație; cache LRU cu cel mult 3 capitole și prefetch la 80% din capitol;
  - pauza (cu o frază înapoi după 5 minute); vitezele 0.75–2.0; temporizator de somn; timp rămas (medie mobilă pe 20 de fraze); reîncercare la eroare; fallback de voce;
  - progres throttled la 3 s, cu flush la pauză, la schimbarea capitolului și la trecerea în fundal.
- Hook-uri: `usePlaybackSession`, `useActiveSentence`, `useSleepTimer`, `useRemainingTime`, `useAutoScroll`.
- UI: text pe paragrafe în `FlashList` cu `React.memo`, evidențiere Reanimated în 150 ms, auto-scroll + „Înapoi la fraza curentă”, atingere/apăsare lungă, glisor de pagină, controale cu play 76 pt.
- Mini-playerul deasupra tab bar-ului, pe Bibliotecă și Setări.

**Teste:** cu `FakeTtsEngine` și fake timers: lanțul de fraze, trecerea la capitolul următor, finalul cărții, apăsări rapide, schimbarea vitezei, somnul, eroarea și fallback-ul de voce.
**Gata când:** după omorârea aplicației, redarea se reia la aceeași frază.

## M6 – Setări, stocare și backup  *(pasul 9)*

- `features/settings`: select de voce, slidere de viteză și ton, „Ascultă o mostră”, comutatoare (evidențiere, antete, fundal), mărimea textului, cu debounce de 500 ms.
- Secțiunea de stocare: bară PDF (din FS) vs AsyncStorage (estimare), ștergerea textului extras.
- Backup: export JSON `{ schemaVersion, exportedAt, entries }` prin `react-native-share`; import cu validare completă și migrare înainte de un singur `multiSet`.
- Starea „nicio voce românească instalată”, cu instrucțiuni.

**Teste:** round-trip de backup, backup invalid respins fără nicio scriere, debounce.
**Gata când:** un backup reimportat pe o instalare curată reface biblioteca și progresul.

## M7 – Performanță, accesibilitate și finisare  *(pasul 10)*

- Măsurători în build de release pe un Android de gamă medie: pornire < 1,5 s, 60 fps la derulare, firul JS liber la import, memorie (cel mult 3 capitole, PDF niciodată întreg în JS).
- Verificare cu TalkBack/VoiceOver, contrast, font mărit.
- Redare în fundal pe iOS pe un dispozitiv real; TurboModule-ul `AbookTts` configurează sesiunea audio pentru redare în fundal.
- Comparare cu machetele, pentru toate cele 6 ecrane și toate stările.
- Bifarea *Definition of done* din PROMPT (secțiunea finală).

---

## Riscuri și puncte de verificat devreme

| Risc | Când se verifică | Plan B |
| --- | --- | --- |
| pdf.js legacy + worker inclus local într-un WebView pe Android | spike la începutul M3b | build separat al worker-ului, încărcat ca blob |
| Limita AsyncStorage pe Android | **Rezolvat în M0:** v3.1.1 folosește Room/SQLite, fără limita de 6 MB | păstrăm valorile sub ~256 KB (limita de 2 MB a `CursorWindow` la citire) |
| `react-native-tts` | **Confirmat în M0:** nu compilează cu Gradle 9 (`jcenter()`), deci a fost scos | **M5: TurboModule propriu** `AbookTts` (Android `TextToSpeech`, iOS `AVSpeechSynthesizer`) în spatele `TtsEngine` |
| Redare cu ecranul blocat (iOS) | M5/M7, pe dispozitiv | `AVAudioSession` cu categoria `playback` în TurboModule |
| pdf.js ca asset local în RN CLI (fără bundler de asset-uri Expo) | spike la începutul M3b | HTML în `android/app/src/main/assets` + bundle iOS, sau HTML inline generat la build |
| Voci `ro-RO` lipsă pe emulator | M5 | testare cu `en-US` + starea „nicio voce” |
| Machete: 5 din 6 ecrane sunt în `.claude/design/` (lipsește Biblioteca cu cărți) | înainte de M4 | se cere macheta lipsă sau se derivă din componentele existente (card, `ProgressBar`, `BookCover`) |
| Etichetele tab-urilor din machete: Bibliotecă / **Ascultă** / Setări (nu „Player”) | M0 (`ro.json`) | — |
