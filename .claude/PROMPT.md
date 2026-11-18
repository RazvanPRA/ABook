# Prompt – Audiobook PDF (React Native + TS)

> Copiază tot conținutul acestui fișier într-un agent de cod (Claude Code). Promptul presupune că skill-urile `modular-architecture`, `audiobook-storage`, `pdf-import-pipeline` și `tts-playback-engine` sunt instalate.

## 1. Rol și obiectiv

Ești un inginer React Native senior. Construiești de la zero aplicația **Audiobook PDF**, în React Native + TypeScript strict, **doar frontend**: fără backend, fără cont, fără rețea la rulare.

Ce face aplicația:

- Utilizatorul alege un PDF de pe telefon. Aplicația îl copiază în spațiul ei, extrage textul local și îl salvează pe dispozitiv.
- Textul e citit cu voce tare prin TTS-ul sistemului, frază cu frază, cu fraza curentă evidențiată pe ecran.
- Progresul, semnele de carte și setările persistă local (AsyncStorage + sistemul de fișiere) și supraviețuiesc repornirii aplicației.
- Totul funcționează offline, iar interfața e în limba română.

UI/UX-ul de referință are 6 ecrane: Bibliotecă, Bibliotecă goală, Import PDF, Detalii carte, Player și Setări. Secțiunea 7 le descrie. Reproduci fidel layout-ul, ierarhia și stările lor.

Reguli de lucru obligatorii:

- Respecți **întocmai** skill-ul `modular-architecture`: limitele de mărime, straturile, feature modules, testele și definition of done. Dacă o regulă din acest prompt intră în conflict cu skill-ul, câștigă skill-ul. Semnalezi conflictul.
- Înainte de cod pentru stocare, import sau player, încarci skill-ul corespunzător: `audiobook-storage`, `pdf-import-pipeline`, `tts-playback-engine`.
- Lucrezi în pașii din secțiunea 8. După fiecare pas, `typecheck`, `lint` și `test` trec înainte să mergi mai departe.

## 2. Stack și librării

Pornim de la **React Native CLI** (`@react-native-community/cli`), cu ultima versiune stabilă de React Native și New Architecture activată. **Fără Expo**: nici SDK, nici `expo-*`, nici `npx expo`. Folderele native `android/` și `ios/` fac parte din repo și se modifică direct (fără config plugins). Versiunile librăriilor native se aleg compatibile cu versiunea de React Native, verificând documentația fiecăreia.

| Zonă | Librărie | De ce |
| --- | --- | --- |
| Platformă | `react-native` (CLI), TypeScript `strict` | Control complet asupra proiectelor native, fără strat Expo |
| Navigare | `@react-navigation/native`, `native-stack`, `bottom-tabs` | Stack + tab-uri, deep links, rute tipate prin `ParamList` |
| Stare | `@reduxjs/toolkit`, `react-redux` | Slice/selectors/thunks, cum cere `modular-architecture` |
| Validare | `zod` | Orice dată citită din stocare e validată înainte de a intra în store |
| Stocare chei | `@react-native-async-storage/async-storage` | Metadate, progres, semne de carte, setări, text pe bucăți |
| Fișiere | `@dr.pogodin/react-native-fs` | PDF-urile stau pe disc, nu în AsyncStorage; citire base64 pe bucăți |
| Alegere fișier | `@react-native-documents/picker` | `types.pdf`, copiere locală (`keepLocalCopy`) |
| Extragere text | `react-native-webview` + `pdfjs-dist` împachetat local | Singura variantă robustă offline; munca grea rămâne în WebView, nu pe firul JS |
| Voce | `react-native-tts`, în spatele interfeței `TtsEngine` | TTS de sistem, voci românești; se poate înlocui cu un modul nativ propriu (TurboModule) fără să atingi feature-urile |
| Liste | `@shopify/flash-list` | Biblioteca și textul din player rămân fluide la sute de elemente |
| Animații, gesturi | `react-native-reanimated`, `react-native-gesture-handler` | Animații pe firul UI (evidențierea frazei, butoane) |
| Slider | `@react-native-community/slider` | Glisorul de pagină, viteza și tonul |
| UI de bază | `react-native-safe-area-context`, `react-native-svg`, `lucide-react-native` | Iconuri cu contur, ca în machete |
| Fonturi | fișiere `.ttf` în `assets/fonts`, legate cu `react-native-asset` | Inter pentru text, Space Grotesk pentru titluri |
| Splash | `react-native-bootsplash` | Splash nativ ținut până la finalul hidratării |
| Texte UI | `i18next`, `react-i18next` | Niciun text hard-codat; doar `ro` deocamdată |
| ID-uri, hash | `react-native-get-random-values` + `uuid`, `@noble/hashes` (SHA-256) | ID-uri stabile, amprentă pentru duplicate |
| Partajare | `react-native-share` | Export backup |
| Teste | Jest (preset `react-native`), `@testing-library/react-native` | Unit, hooks, componente |
| Calitate | ESLint (`@react-native/eslint-config` + `typescript-eslint`), Prettier, `eslint-plugin-boundaries` sau `dependency-cruiser` | Impune direcția dependențelor între straturi și interzice importurile circulare |

Ce nu folosești:

- `redux-persist`, pentru că persistența trece prin repositories.
- Librării PDF native care necesită rețea sau servicii externe.
- Vreo librărie UI completă (de tip kit), pentru că primitivele se construiesc pe tokens.

- Expo și orice pachet `expo-*` (inclusiv prin `install-expo-modules`).

Pentru redare în fundal pe iOS adaugi `UIBackgroundModes: ["audio"]` direct în `ios/<App>/Info.plist` și verifici pe un dispozitiv real. Dacă `react-native-tts` se oprește cu ecranul blocat sau nu merge pe New Architecture, scrii un TurboModule propriu (Android `TextToSpeech`, iOS `AVSpeechSynthesizer`) în spatele `TtsEngine`.

## 3. Arhitectură

Aplicația are cinci feature modules: `library`, `import`, `book`, `player`, `settings`. Fiecare are un `index.ts` public. Stocarea, extragerea PDF și vocea sunt servicii comune sub ele, injectate dintr-un singur loc.

```
src/
  app/
    navigation/                React Navigation: RootStack (Tabs, Import modal, Book/:id) + Tabs (Library, Player, Settings), ParamList tipate, linking
    dependencies.ts            singurul loc unde se leagă implementările concrete de interfețe
    providers/                 StoreProvider, ThemeProvider, I18nProvider, PdfExtractorHost
    bootstrap.ts               hidratare din stocare înainte de primul ecran (splash ținut până la final)
  features/
    library/                   listă cărți, căutare, filtre, card „Continuă ascultarea”, stare goală
    import/                    picker, pipeline de import, ecran de progres, formular titlu/autor/limbă
    book/                      detalii, cuprins, semne de carte, ștergere
    player/                    sesiune de redare, coadă de fraze, evidențiere, viteză, temporizator somn
    settings/                  voce, viteză implicită, ton, comutatoare, stocare, backup
  services/
    pdf/                       PdfTextExtractor (interfață) + WebViewPdfExtractor
    text/                      curățare text, eliminare antete/subsoluri, segmentare în fraze, împărțire în capitole
    tts/                       TtsEngine (interfață) + RnTtsEngine
  repositories/
    BookRepository.ts          interfață + LocalBookRepository (AsyncStorage + FS)
    ProgressRepository.ts
    SettingsRepository.ts
  storage/
    keyValueStore.ts           adaptor peste AsyncStorage (multiGet/multiSet, namespacing, versiune schemă)
    fileStore.ts               adaptor peste @dr.pogodin/react-native-fs
    migrations/                migrări de schemă, numerotate
  shared/
    ui/                        Button, IconButton, Chip, ChipGroup, Card, ProgressBar, Switch, ListRow, Slider, BookCover, BottomTabBar, ScreenHeader, EmptyState
    theme/                     tokens (culori, spațiere, raze, tipografie), useTheme
    i18n/                      ro.json
    domain/                    tipuri comune: BookId, PageNumber, SentenceIndex
    utils/                     formatare (dimensiuni fișiere, durate, procente), grupate pe scop
```

Reguli specifice acestei aplicații, pe lângă `modular-architecture`:

- Doar repositories ating `storage/`. Feature-urile văd doar interfețele `BookRepository`, `ProgressRepository` și `SettingsRepository`.
- `player` nu importă din `library` sau din `book`. Ia cartea prin selectorii publici din `book/index.ts`.
- `services/pdf` și `services/tts` nu știu de Redux. Primesc și întorc date tipate și emit evenimente prin callback-uri.
- `WebViewPdfExtractor` are nevoie de un WebView montat. `PdfExtractorHost` îl montează o singură dată, ascuns, în `app/providers`, și expune extractorul prin `dependencies.ts`.

## 4. Model de date și stocare

PDF-ul stă pe disc, iar tot ce e text sau stare stă în AsyncStorage, împărțit în chei mici. Motivul: pe Android, AsyncStorage are o limită totală implicită mică (în v1 ~6 MB, configurabilă prin `AsyncStorage_db_size_in_MB`), iar o singură valoare mare poate eșua la citire. Verifici limitele exacte în documentația versiunii instalate și setezi limita direct în `android/gradle.properties`.

| Cheie | Conținut | Scriere |
| --- | --- | --- |
| `abk:schemaVersion` | număr | la migrare |
| `abk:books` | `BookId[]` în ordinea din bibliotecă | la import / ștergere |
| `abk:book:{id}:meta` | `BookMeta` | la import, la editare |
| `abk:book:{id}:toc` | `Chapter[]` | o dată, la final de import |
| `abk:book:{id}:ch:{n}` | `ChapterChunk` (fraze + paginile lor) | o dată, în loturi `multiSet` |
| `abk:book:{id}:progress` | `Progress` | throttled, vezi mai jos |
| `abk:book:{id}:bookmarks` | `Bookmark[]` | la adăugare / ștergere |
| `abk:settings` | `Settings` | debounce 500 ms |

Fișierul PDF: `DocumentDirectoryPath/books/{id}.pdf`.

```ts
type BookStatus = 'processing' | 'ready' | 'failed';

interface BookMeta {
  id: BookId; title: string; author: string; language: 'ro-RO' | 'en-US';
  fileUri: string; fileSizeBytes: number; pageCount: number;
  chapterCount: number; sentenceCount: number;
  status: BookStatus; processedPages: number; importedAt: string; // ISO
  coverColor: string; // token din paletă, ales determinist din id
}
interface Chapter { index: number; title: string; startPage: number; endPage: number; sentenceCount: number; }
interface ChapterChunk { sentences: string[]; sentencePages: number[]; } // sentencePages[i] = pagina frazei i
interface Progress { chapter: number; sentence: number; page: number; finished: boolean; updatedAt: string; }
interface Bookmark { id: string; chapter: number; sentence: number; page: number; excerpt: string; createdAt: string; }
interface Settings {
  voiceId: string | null; defaultRate: number; pitch: number;
  highlightSentence: boolean; skipHeadersFooters: boolean; backgroundPlayback: boolean;
  fontScale: 0 | 1 | 2;
}
```

Reguli de stocare:

- Toate tipurile de mai sus au schema `zod` în `model/schemas.ts`. Valorile se validează la citire, iar o valoare invalidă se loghează și se tratează ca lipsă, fără crash.
- Un `ChapterChunk` serializat rămâne sub ~256 KB. Un capitol mai mare se împarte în `ch:{n}:p:{k}`.
- Ordinea scrierii la import: întâi fișierul, apoi `meta` cu `processing`, apoi bucățile, `toc` și la final `meta` cu `ready`. La pornire, o carte rămasă `processing` e reluată sau marcată `failed`.
- Progresul se scrie cel mult o dată la 3 s în timpul redării, plus imediat la pauză, la schimbarea capitolului și la `AppState` → `background`.
- La ștergere: `multiRemove` pe toate cheile cărții, apoi fișierul. Nu rămân chei orfane.
- „Exportă backup” scrie un JSON `{ schemaVersion, exportedAt, entries }` cu toate cheile `abk:*`, fără PDF-uri, și îl partajează prin `react-native-share`. „Importă backup” îl validează înainte să scrie ceva.
- Ecranul de stocare arată dimensiunea fișierelor PDF (din FS) și o estimare a datelor din AsyncStorage (lungimea valorilor serializate).

## 5. Pipeline de import PDF

Importul e o mașină de stări care merge pagină cu pagină. Utilizatorul poate asculta primul capitol înainte ca restul să fie procesat, cum arată ecranul Import.

1. **Alegere.** `@react-native-documents/picker` cu `types.pdf`. Respingi fișierele de peste un prag configurabil (implicit 100 MB), cu mesaj clar.
2. **Copiere.** Muți fișierul în `DocumentDirectoryPath/books/{id}.pdf`, apoi scrii `meta` cu `status: 'processing'`.
3. **Deschidere.** `PdfTextExtractor.open(uri)` citește fișierul ca base64 în bucăți și îl trimite în WebView. pdf.js (build-ul legacy, worker inclus local) întoarce `pageCount` și metadatele `Title` / `Author`, folosite la precompletarea formularului.
4. **Extragere pe pagini.** `getTextContent()` pentru fiecare pagină, în loturi de câte 5 pagini. Fiecare pagină se întoarce prin `postMessage` ca `{ page, lines: { text, y, height }[] }`. Progresul (`processedPages`) actualizează bara din UI.
5. **Curățare** (`services/text`, funcții pure):
    - elimini antetele și subsolurile repetate: liniile din zona de sus/jos care apar pe ≥ 50% din pagini, după normalizarea cifrelor;
    - elimini numerele de pagină izolate;
    - lipești cuvintele despărțite cu cratimă la capăt de rând;
    - unifici spațiile și diacriticele (ş/ţ cu sedilă devin ș/ț cu virgulă).
6. **Segmentare în fraze.** Un segmentator propriu, cu reguli pentru abrevierile românești (dl., dna., nr., pag., ș.a., etc.), ghilimelele „” și dialogurile cu linie de dialog. Frazele de peste ~400 de caractere se taie la virgulă sau punct și virgulă, ca TTS-ul să rămână responsiv.
7. **Capitole.** Folosești outline-ul PDF-ului (`getOutline`) dacă există. Altfel detectezi titluri (rânduri scurte, cu font mai mare, de tip „Capitolul”, „Partea” sau cifre romane). Altfel împarți la fiecare ~10 pagini.
8. **Salvare.** Fiecare capitol complet se scrie imediat cu `multiSet`. După primul capitol, cartea e redabilă.
9. **Final.** Scrii `toc`, apoi `meta` cu `status: 'ready'`.

Cazuri de tratat explicit:

- **PDF scanat**, recunoscut când primele 5 pagini au sub 20 de caractere fiecare. Oprești importul și explici că e nevoie de un PDF cu text.
- **PDF protejat cu parolă sau corupt.** Afișezi o eroare clară și ștergi fișierul copiat.
- **Anulare la jumătate.** Curăți complet cheile și fișierul.
- **Aplicația omorâtă în timpul importului.** La următoarea pornire reiei de la `processedPages`.
- **Fișier duplicat.** Compari o amprentă (dimensiune + primii 64 KB, SHA-256 cu `@noble/hashes`) și întrebi dacă utilizatorul vrea o copie.

WebView-ul nu are acces la rețea (`originWhitelist` restrâns, fără `fetch` extern). Mesajele primite din el se validează cu `zod`.

## 6. Motorul de voce și playerul

Playerul citește **o frază per utterance**. Așa, evidențierea, saltul înapoi/înainte și salvarea progresului sunt exacte pe orice platformă, fără să depinzi de evenimentele de cuvânt ale TTS-ului.

```ts
interface TtsEngine {
  listVoices(language: string): Promise<Voice[]>;
  speak(text: string, opts: { voiceId: string | null; rate: number; pitch: number;
    onStart(): void; onDone(): void; onError(e: TtsError): void }): void;
  stop(): Promise<void>;
  isSpeaking(): Promise<boolean>;
}
```

Sesiunea de redare (`features/player`):

- Starea e `idle | loading | playing | paused | ended | error` și se schimbă doar prin acțiuni: `play`, `pause`, `seekSentence(delta)`, `seekPage(page)`, `seekChapter(n)`, `setRate`, `setSleepTimer`.
- Prin **prefetch**, capitolul curent și următorul stau în memorie. Capitolele se încarcă din AsyncStorage la cerere, iar în cache rămân cel mult 3.
- **Lanțul:** la `onDone` treci la fraza următoare. La finalul capitolului treci la următorul, iar la finalul cărții marchezi `finished: true`.
- **Pauza** apelează `stop()` și reține indexul frazei. Reluarea pornește de la începutul frazei curente. După o pauză mai lungă de 5 minute, reiei cu o frază în urmă, pentru context.
- Comenzile rapide se protejează cu un **token de generație**: fiecare `speak` primește un token, iar un `onDone` cu token vechi e ignorat. Astfel nu se sar fraze când utilizatorul apasă repede.
- **Viteza** are pașii 0.75, 0.9, 1.0, 1.25, 1.5 și 2.0. Se aplică de la fraza următoare, sau imediat, prin repornirea frazei curente.
- **Temporizatorul de somn** are opțiunile 15 min, 30 min și „final capitol”. La expirare, redarea se oprește la sfârșitul frazei curente, nu în mijlocul ei.
- **Timpul rămas** se estimează din caracterele rămase împărțite la viteza măsurată (caractere/secundă, medie mobilă pe ultimele 20 de fraze). E afișat ca „~ 1 h 52 min rămase”.
- **Întreruperi:** la `AppState` → `background`, cu redarea în fundal dezactivată, faci pauză și salvezi progresul. La o eroare TTS încerci o dată aceeași frază, apoi treci în `error` cu mesaj și buton „Încearcă din nou”.
- **Vocea:** dacă vocea salvată nu mai există pe dispozitiv, alegi prima voce `ro-RO` disponibilă și anunți utilizatorul. Dacă nu există nicio voce românească, explici cum se instalează din setările sistemului.

Evidențierea în text:

- Textul capitolului se afișează într-un `FlashList` cu un item per paragraf (frazele grupate pe paragrafe). Item-ul e `React.memo`, iar comparatorul ia în calcul doar dacă fraza activă e în acel paragraf.
- Fraza activă are fundal accent la 18% opacitate. Frazele citite sunt atenuate. Tranziția se face cu Reanimated, în 150 ms.
- Lista face auto-scroll ca fraza activă să stea în treimea de sus. Dacă utilizatorul derulează manual, auto-scroll-ul se suspendă și apare un buton „Înapoi la fraza curentă”.
- Atingerea unei fraze o face frază curentă, iar apăsarea lungă adaugă un semn de carte cu fragmentul ei.

## 7. Ecrane, componente și design tokens

Tema e întunecată, cu un singur accent chihlimbar. Toate valorile de mai jos devin tokens în `shared/theme`; nicio componentă nu folosește hex direct.

| Token | Valoare | Folosire |
| --- | --- | --- |
| `color.bg` | #111316 | fundal ecran |
| `color.surface` | #1B1E23 | carduri, input-uri |
| `color.surfaceRaised` | #252931 | butoane secundare, select |
| `color.border` | #2E333B | contururi, șina barelor de progres |
| `color.divider` | #22262C | separatoare între rânduri |
| `color.tabBar` | #15181C | bara de navigare de jos |
| `color.text` | #F2EFE9 | text principal |
| `color.textMuted` | #A3A9B3 | text secundar, etichete |
| `color.textRead` | #8A9099 | fraze deja citite |
| `color.accent` / `color.onAccent` | #F0B13C / #1A1405 | acțiune principală, progres, element activ |
| `color.success` / `color.successBg` | #7FD8B4 / #2B4A3E | pas finalizat, capitol ascultat |
| `color.danger` / `color.dangerBorder` | #F08A8A / #4A2E2E | acțiuni distructive |
| `color.info` | #8FA8FF | segmentul PDF din bara de stocare |
| `color.cover[]` | #3B4A6B, #6B3B3B, #3B6B57 | coperte generate (ales din hash-ul id-ului) |
| `space` | 4, 8, 12, 16, 20, 24 | padding ecran 20, gap carduri 14–16 |
| `radius` | 6, 8, 12, 14, 16, 20, pill | copertă mică 6, input 12, buton principal 14, card 16–20 |
| `type.display` | Space Grotesk 28/700 | titlul ecranului |
| `type.title` | Space Grotesk 20–24/600–700 | titlu carte, header |
| `type.body` | Inter 15–16/400–600 | text, rânduri de listă |
| `type.caption` / `type.overline` | Inter 12–13 / 12/600 majuscule, spațiere 0.08em | metadate / titluri de secțiune |

Ecranele:

| Ecran | Rută | Conținut | Stări |
| --- | --- | --- | --- |
| Bibliotecă | `Tabs/Library` | header + buton setări, căutare, card „Continuă ascultarea” cu play, chips Toate / În curs / Terminate, listă cărți (copertă, titlu, autor, progres), FAB „Importă PDF” | încărcare (skeleton), goală, fără rezultate la căutare, carte în procesare (bară de import în rând) |
| Bibliotecă goală | aceeași rută | ilustrație, titlu, explicație offline, buton „Importă primul PDF”, notă despre PDF-urile scanate | — |
| Import PDF | `Import` (modal) | card fișier + „Schimbă”, pași de procesare cu stare (gata / în curs cu pagina X/Y / în așteptare), formular titlu / autor / limba vocii, buton „Adaugă în bibliotecă” | eroare per pas, PDF scanat, duplicat, anulare |
| Detalii carte | `Book` (`{ id }`) | copertă mare, titlu, autor, chips metadate, „Continuă de la pagina N”, progres, cuprins cu stare per capitol, semne de carte, „Șterge de pe dispozitiv” (cu confirmare) | carte în procesare, carte eșuată (reîncearcă) |
| Player | `Tabs/Player` | header cu capitolul, semn de carte, text cu fraza evidențiată, glisor pagină + timp rămas, controale (pagină ←, frază ←, play/pauză 76 pt, frază →, pagină →), viteză, somn, mărime text | nicio carte aleasă, încărcare, eroare voce, final carte |
| Setări | `Tabs/Settings` | voce (select), viteză și ton (slidere), „Ascultă o mostră”, comutatoare (evidențiere, antete, fundal), stocare (bară PDF vs AsyncStorage, export/import backup, ștergere text extras) | nicio voce românească instalată |

Primitivele din `shared/ui` (`Button` cu variantele primary, secondary, ghost și danger; `IconButton`, `Chip`, `ChipGroup`, `Card`, `ProgressBar`, `Switch`, `ListRow`, `Slider`, `BookCover`, `BottomTabBar`, `ScreenHeader`, `EmptyState`) se fac întâi și se refolosesc pe toate ecranele. Un mini-player persistent deasupra tab bar-ului apare pe Bibliotecă și Setări cât timp rulează o carte.

## 8. Calitate și ordinea de lucru

Performanță (ținte verificate pe un Android de gamă medie, în build de release):

- **Pornire:** primul ecran util în sub 1,5 s. La boot hidratezi doar `abk:books`, `meta`-urile și `settings`, într-un singur `multiGet`. Textul se încarcă la cerere.
- **Fluiditate:** 60 fps la derulare în bibliotecă și în textul playerului. Folosești `FlashList`, item-uri `React.memo`, selectori memoizați cu `createSelector` și callback-uri stabile.
- **Import:** firul JS rămâne liber, iar UI-ul răspunde în timpul importului. Parsarea rămâne în WebView, iar curățarea și segmentarea merg pe loturi, cu cedare (`await` între loturi).
- **Memorie:** cel mult 3 capitole în cache. PDF-ul nu se ține niciodată întreg în JS; se trimite în WebView în bucăți.
- **Scrieri:** progresul e throttled, setările au debounce, iar importul scrie în loturi `multiSet`.

Accesibilitate:

- Țintă de atingere de minim 44 pt.
- `accessibilityRole`, `accessibilityState` și `accessibilityLabel` în română pe fiecare control.
- Fraza curentă e anunțată de VoiceOver/TalkBack doar la cerere, ca să nu se suprapună peste TTS.
- Contrast text de minim 4.5:1.
- Suport pentru mărirea fontului din sistem (limitat la 1.4× în header-e).

Teste (pe lângă cerințele din `modular-architecture`):

- `services/text`: antete repetate, cratime la capăt de rând, abrevieri românești, dialog, diacritice cu sedilă, fraze foarte lungi, text gol.
- Repositories, cu un `keyValueStore` în memorie: ordinea scrierii la import, reluare după crash, ștergere fără chei orfane, valori corupte, migrări.
- Sesiunea de redare, cu un `TtsEngine` fals: lanțul de fraze, token de generație la apăsări rapide, trecerea la capitolul următor, temporizatorul de somn, schimbarea vitezei, final carte.
- Componente: fiecare primitivă și fiecare stare din tabelul de ecrane.

Ordinea de lucru (fiecare pas se încheie cu `typecheck`, `lint` și `test` verzi și un rezumat conform `modular-architecture`):

1. Proiect React Native CLI, TS strict, ESLint cu reguli de straturi, Jest, React Navigation cu tab-uri goale, fonturi.
2. `shared/theme` (tokens) și `shared/ui` (toate primitivele, cu teste).
3. `storage/`, repositories, schemele `zod`, migrările și `dependencies.ts`.
4. `services/text` (pur, acoperit complet de teste).
5. `services/pdf` cu `PdfExtractorHost` și feature-ul `import`.
6. Feature-ul `library`, cu starea goală și cartea în procesare.
7. Feature-ul `book`.
8. `services/tts` și feature-ul `player`, plus mini-playerul.
9. Feature-ul `settings`, cu stocare și backup.
10. Trecere de performanță și accesibilitate pe dispozitiv real; repari ce nu atinge țintele de mai sus.

Definition of done pentru întreaga aplicație:

- [ ] Un PDF cu text de 300+ pagini se importă fără blocarea UI-ului, iar primul capitol se poate asculta înainte de final.
- [ ] După omorârea aplicației, redarea se reia la aceeași frază.
- [ ] Un PDF scanat, unul protejat și unul corupt dau mesaje clare și nu lasă date în urmă.
- [ ] Ștergerea unei cărți eliberează tot spațiul ocupat de ea.
- [ ] Backup-ul exportat și reimportat pe o instalare curată reface biblioteca (fără PDF-uri) și progresul.
- [ ] Toate cele 6 ecrane corespund machetelor, în toate stările din tabel.
