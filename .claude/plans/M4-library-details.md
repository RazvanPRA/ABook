# M4 – Library and book details

Branch: `m4-library-details`, from `dev` at `b8e8791`. References: `PLAN.md` (M4, risks), `PROMPT.md` §3, §4, §7, §8, the `modular-architecture`, `audiobook-storage` and `pdf-import-pipeline` (retry, delete) skills, the mockups `.claude/design/01-biblioteca-goala.png` and `03-detalii-carte.png`, `M2-storage.md`, `M3-import.md`.

## Goal

The Library tab lists, searches and filters the imported books, offers "Continuă ascultarea" and opens the import. The Book screen shows a book's details, table of contents and bookmarks, and can delete the book or continue its import. After a delete, including during an import, no keys or files of the book remain.

Out of scope: playback, the mini-player and creating bookmarks (M5), settings and backup (M6), release-build performance (M7).

## Decisions

Confirmed by the owner (2026-11-24):

1. **The failure reason is stored** in `BookMeta`, with migration 003.
2. **The populated Library has no mockup:** it is derived from `PROMPT.md` §7 and the existing primitives, unless `.claude/design/00-biblioteca.png` appears.
3. **"Continuă" opens the Ascultă tab** until M5.
4. **Percent listened = `page / pageCount`**, the same in the list and in the details (34 of 82 = 41%, as in the mockup). `finished` is 100%; `pageCount` 0 gives 0. Sentences would be more exact, but need every book's toc.
5. **A stalled import can be continued in the session.** After a transient resume failure the book stays `processing` with nothing running; it gets its own state and "Reia importul" (steps 4, 12, 13).
6. **Cancelling an import to delete its book doesn't stop the other resumes.** A cancel by the user on the Import screen still does, as in M3 (steps 4, 5, 13).
7. **Language:** code, identifiers, comments, tests, docs and commit messages in English; UI copy in Romanian, through `ro.json`.
8. **On the emulator, only the PDFs from `C:\ModDeInvatare\Book-PDF` are used** (decided at step 8): no made-up books, no PDFs generated in `.dev-pdfs/`. What they can't cover (200 books, the failure reasons, progress and bookmarks before M5) is tested in Jest only and noted as not verified on a device.

Design assumptions (reported if they change):

- **Feature dependencies:** `book → import → library` and `book → library`; `library` imports neither. Features get navigation as callbacks from the route adapters in `RootNavigator` / `TabsNavigator` (as `ImportRoute` does).
- **Progress lives in a `library` slice**, `null` per book when never played. Boot still reads only order, metas and settings (storage rule 8); right after hydration a thunk reads every progress with one `getMany`. `book/index.ts` re-exports the selectors the player needs.
- **The Library's processing bar** uses `processedPages / pageCount` from the meta, so it moves once per chapter. The Book screen may use the live import phase.
- **Cancel and continue are awaited thunks** exported by `import`, not events: a delete has to wait for the pipeline's cleanup. A single plain action, `playbackRequested({ bookId, chapter?, sentence? })`, goes in `shared/domain` for M5 to handle; M4 only navigates.
- **Book order:** last played first (`progress.updatedAt`), then the stored order (newest import first). It is a selector; `abk:books` is not rewritten.
- **"În curs"** = has progress and isn't finished, or is `processing`.
- **`failed` is rare:** a new import that fails is removed (M3). `failed` comes only from a resume, or from a missing PDF at boot. A transient resume failure leaves the book `processing` with nothing running, so "stalled" is a state of its own, with "Reia importul".
- **Filter chips keep the `radio` role** of `ChipGroup`, not `tab`.
- File names follow the repo (`filterBooks.ts`, no `.service` suffix).

## States

### Library

| State | What shows |
| --- | --- |
| progress loading | skeleton: card and 3 rows |
| empty | `EmptyState` as in `01-biblioteca-goala.png` |
| books | header + settings button, search, continue card (only with an unfinished, started book), chips, list, FAB |
| nothing matches | search: message + "Șterge căutarea"; filter: its own message |
| book processing | import bar in the row; "Se pregătește" while `pageCount` is 0 |
| book failed | "Import eșuat" in the row; tap opens the details |

### Book

| State | What shows |
| --- | --- |
| loading | skeleton: cover and 4 toc rows |
| missing (unknown, malformed or deleted id) | `EmptyState` "Cartea nu mai există" + back to the Library |
| processing, running | banner with page X of Y, saved chapters; play enabled from the first chapter |
| processing, stalled | banner "Import întrerupt" + "Reia importul" (disabled while another import runs) |
| failed | reason, "Reîncearcă" only when retryable, delete; saved chapters stay playable |
| ready | the full `03-detalii-carte.png` |
| delete failed | error + "Încearcă din nou" |

Primary button: "Începe să asculți", "Continuă de la pagina N", or "Ascultă din nou" (finished; resets progress after confirmation).

## Steps

Each step ends with a green `npm run check` and a separate commit; its section is completed with "**Done** (date). Findings: …".

### M4a – Data

#### 1. Branch and plan
- This plan; `PLAN.md` M4 points to it. The `library-details` skill draft is replaced by this file.

#### 2. Failure reason and migration 003
- `BookMeta.failure`: `'scanned' | 'password' | 'corrupt' | 'missing-file' | null`. Set by `keepResumedBook` and `failUnresumableImports`; cleared when the import continues.
- `003-failure-reason.ts`: pure and idempotent, existing books get `null`.
- `isRetryableFailure(failure)`: only `null` (unknown reason), and only when the PDF still exists. `BookRepository` gains a check for the file.
- **Tests:** migration (twice, corrupt values), both writers, schema.

**Done** (2026-11-24). Findings:

- 002 and 003 do the same thing (a missing meta field becomes `null`), so both use `addNullMetaField`.
- `isRetryableFailure(book)` is pure and lives in `shared/domain` (the import and book features both need it); the file check is `BookRepository.hasPdf(book)`.
- `failure` is cleared where the import continues (step 4). Earlier migration tests now run only their own slice of `MIGRATIONS`.

#### 3. Progress in the store
- `ProgressRepository.listProgress(ids)` with one `getMany`; invalid values are logged and skipped. `libraryProgress` slice, hydration thunk after boot, removal on `bookRemoved`.
- Pure services: `listenedPercent`, `bookListStatus`, `pickContinueListening`, `sortByLastPlayed`; memoized selectors.
- **Tests:** one `getMany` call, corrupt progress, pageCount 0, finished, ties, no progress; boot still doesn't read progress.

**Done** (2026-11-24). Findings:

- The slice is `libraryProgress` (`byBook`, `loaded`). A `null` entry means "started over since the boot", so a late read doesn't bring the old progress back; a book removed during the read is left out too.
- "Boot doesn't read progress" was already guarded by `loadBootSnapshot.test.ts`.
- `listenedPercent` returns a whole percent; `bookListStatus` puts the import status before the listening one.

#### 4. Cancel and continue one book's import
- `import/index.ts`: `cancelImportOf(bookId)` (cancels if this book's import is active or waits on a duplicate, then awaits `waitForPipeline`) and `continueImport(bookId)` (guarded, for stalled and retryable books), `selectImportingBookId`.
- `resumeImports` re-reads each book from the store before it starts, so a book deleted while queued is skipped. Cancelling one book for a delete must not stop the remaining resumes; a user cancel still does.
- **Tests:** cancel during extraction leaves no keys or file; another book's import isn't touched; queued and deleted; the remaining books still resume; continue equals an uninterrupted import; continue fails again (transient, permanent).

**Done** (2026-11-24). Findings:

- **A book being deleted is marked first** (`discardedBooks.ts`), because it stays in the store until storage is done: an import of it that is queued, or has started but not yet told the slice, would otherwise write after the delete. `resumeImports` also uses the mark to tell a cancel-for-delete (the others go on) from a user cancel (they wait for the next boot).
- **Waiting is per book** (`waitForBook`): `guarded` now remembers the pipeline at the head of its queue and its book. `waitForPipeline` waits for the whole queue, so a delete would have waited for other imports.
- `continueImport` is one pipeline run, so a second tap is queued and finds nothing left to do. Without the PDF it marks the book `failed` (`missing-file`).
- Import thunks now read the library slice, so `ImportThunk` needs `LibraryRootState`.

#### 5. Delete thunk
- `features/book`: `cancelImportOf` → `bookRepository.deleteBook` → `bookRemoved`. `deleteBook` is idempotent: one retry, then an error the screen shows; leftovers are swept at boot.
- **Tests:** no key or file remains (ready, processing, queued, failed); failure at each storage step; retry.

**Done** (2026-11-24). Findings:

- The outcome is kept in `bookDeletion` (`deleting` / `failed`), because the import's own cleanup takes the book out of the library before the delete is over: the screen can't tell the two apart from the library alone.
- The tests run over the real repositories and in-memory stores, so they live in `app/__tests__/deleteBook.test.ts` with `fakeApp` (features can't import repositories).
- A book whose delete failed can't continue its import in that session; it can only be deleted again.

### M4b – Primitives and navigation

#### 6. Missing primitives
- `Skeleton`, `SearchField`, `Fab`, `ConfirmDialog`, `Snackbar`, and a menu sheet for "⋯" (reuse the `SelectSheet` look). Added to `abook://dev/ui`.
- **Tests:** render, interaction, a11y state, ≥ 44 pt, font scale; reduced motion for the skeleton.

**Done** (2026-11-24). Findings:

- `SheetModal` (scrim, back button) was extracted from `SelectSheet`; `Select`, `MenuSheet` and `ConfirmDialog` share it. `SearchField` reuses `useTextField` and `fieldBox`.
- `Fab` caps its label at 1.4×, so it doesn't cover the list at font scale 2.0. `Snackbar` has no timer: whoever shows it hides it.
- The Reanimated mock in `jest.setup.js` gained `withRepeat` and `useReducedMotion`.

#### 7. Deep links
- A link that arrives during bootstrap isn't lost (risk in `PLAN.md`). `abook://book/<id>` is validated; a bad id reaches the missing state.
- **Tests:** link during bootstrap, cold start, bad id. **Emulator:** `adb shell am start` while booting.

**Done** (2026-11-24). Findings:

- **Two windows, two fixes.** After JS starts, `usePendingLink` keeps the last link and hands it over as the initial URL (also released on `onReady`). Before JS starts nobody can listen, and `getInitialURL` read the activity's first intent; found on the emulator. `MainActivity.onNewIntent` now calls `setIntent`.
- `initialRouteName: 'Tabs'` puts the tabs under a linked root screen, so back leads to the Library.
- A malformed or unknown id shows `MissingBook` ("Cartea nu mai există"), built here already.
- Emulator: links sent 0.2, 0.8, 1.2, 2, 2.6, 3.2 and 4 s after launch all open their screen; a cold start with a bad id shows the missing state.

#### 8. No made-up data
- Planned as a dev seed (ready, finished, failed and stalled books, 200 books); dropped by the owner (decision 8). The M2 seed goes too: `abook://dev/storage` only shows what is stored, and deletes it.

**Done** (2026-11-24). Findings:

- `seedSampleBook` and "Adaugă carte de test" are gone; the inspector's tests store their book through the repositories.

### M4c – Library

#### 9. Search and filter
- `filterBooks`: title + author, case- and diacritics-insensitive, cedilla included, without `String.normalize`. Query and filter in their own slice; 200 ms debounce.
- **Tests:** table-driven ("sadoveanu", "amintiri", ș/ş, empty query, each filter).

#### 10. Library screen
- `LibraryHeader`, `LibrarySearch`, `ContinueListeningCard`, `LibraryFilterChips`, `BookList` / `BookListItem` (first use of FlashList in `src`, memoized rows), `LibraryEmpty`, `NoResults`, `Fab`. Texts in `library.*`, counts through `romanianPlural`.
- A row is one accessible element: "Amintiri din copilărie, Ion Creangă, 41% ascultat".
- **Tests:** each state in the table, and a list of 200 books. **Emulator:** FlashList early, with books imported from Book-PDF; smooth scrolling of 200 books isn't verified on a device (M7).

### M4d – Book

#### 11. Book data and services
- Thunks for toc and bookmarks, slice keyed by book. The toc is reloaded as chapters are saved. `deriveChapterStatus` (done / current / pending), `formatBookMeta`, `chapterTitle` (an untitled chapter gets its i18n name).
- **Tests:** no progress, mid-chapter, boundary, finished, empty toc; stale answers after switching books.

#### 12. Book screen
- `BookHero`, `PrimaryPlayButton`, `ListenProgress`, `ChapterList` / `ChapterRow`, `BookmarkList` / `BookmarkRow`, `ImportBanner`, `FailedBanner`, delete with confirmation (title + freed space, hint that it can't be undone).
- Removing a bookmark shows a 5 s "Anulează" before it is written; leaving the screen writes it.
- Chapter row: "Partea a II-a, paginile 22–43, în curs de ascultare".
- **Tests:** each state in the table; reset progress only after confirmation; undo and leave.

### M4e – Closing

#### 13. Emulator verification
- Delete a ready book, and one during the import of `Microservices-Patterns.pdf`: key count on `abook://dev/storage` and `adb shell run-as com.abook ls files/books` as before the import.
- Kill mid-import, relaunch, delete a queued book. With two interrupted books, delete the one resuming: the other still resumes. Stalled → "Reia importul". Only with the two PDFs from Book-PDF, and deleting only books imported for this check. The failure reasons, progress and bookmarks stay in Jest.
- `uiautomator` labels and sizes, font scale 2.0, comparison with both mockups.

#### 14. Closing
- `modular-architecture` §10 checklist, summary of units, `PLAN.md` (M4 ✅, risks), `CLAUDE.md` (M4 pitfalls).

## Definition of done – M4

- [ ] Every state in the two tables is built and tested; both mockups match.
- [ ] Deleting a book, during an import too, leaves no keys or files (emulator).
- [ ] A stalled import continues from where it stopped.
- [ ] Search and filters work with Romanian diacritics; a list of 200 books renders in Jest.
- [ ] A deep link during bootstrap isn't lost.
- [ ] No circular or internal cross-feature imports; `npm run check` green; one commit per step.
