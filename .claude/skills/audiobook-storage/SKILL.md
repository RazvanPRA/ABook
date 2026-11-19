---
name: audiobook-storage
description: Storage rules for the Audiobook PDF React Native app: AsyncStorage key schema, chunking, write order, migrations, backup. Use for any code touching persistence.
---

# Audiobook storage

Applies together with `modular-architecture`. Only `src/storage/` and `src/repositories/` may import AsyncStorage or `@dr.pogodin/react-native-fs`. The project uses React Native CLI; no Expo packages.

## Where data lives

- PDF binaries: `DocumentDirectoryPath/books/{id}.pdf` (`@dr.pogodin/react-native-fs`). Never in AsyncStorage, never fully in JS memory.
- Everything else: AsyncStorage, under the `abk:` namespace.

| Key | Value |
|---|---|
| `abk:schemaVersion` | number |
| `abk:books` | `BookId[]` (library order) |
| `abk:book:{id}:meta` | `BookMeta` |
| `abk:book:{id}:toc` | `Chapter[]` |
| `abk:book:{id}:ch:{n}` (or `:ch:{n}:p:{k}`) | `ChapterChunk { sentences: string[]; sentencePages: number[] }` |
| `abk:book:{id}:progress` | `Progress` |
| `abk:book:{id}:bookmarks` | `Bookmark[]` |
| `abk:settings` | `Settings` |

Build keys only through `storage/keys.ts` helpers (`bookKey(id, 'meta')`, `chapterKey(id, n, part?)`); never concatenate key strings elsewhere.

## Hard rules

1. Every value has a zod schema in its feature's `model/schemas.ts`. Validate on read; an invalid value is logged and treated as missing, never thrown to the UI.
2. One serialized value stays under ~256 KB. Split larger chapters into parts. AsyncStorage v3 on Android uses Room/SQLite (no 6 MB total cap, no `AsyncStorage_db_size_in_MB`), but a row larger than ~2 MB fails to read through `CursorWindow`, so the 256 KB rule stays.
3. Batch: use `getMany` / `setMany` / `removeMany` (AsyncStorage v3; the older names `multiGet` / `multiSet` / `multiRemove` in this document mean these). Never loop single `getItem` calls.
4. Import write order: file -> `meta` (`processing`) -> chunks as each chapter completes -> `toc` -> `meta` (`ready`). On boot, resume or mark `failed` any book left in `processing`.
5. Progress writes: throttle to at most one per 3 s while playing; flush immediately on pause, chapter change and `AppState` -> `background`. Settings: debounce 500 ms.
6. Delete a book: `multiRemove` every key with its prefix (enumerate via `getAllKeys` filtered by prefix), then delete the file. Leave no orphan keys.
7. Schema changes: add a numbered migration in `storage/migrations/` (`003-split-large-chapters.ts`), each a pure `(entries) => entries` plus a test. Run pending migrations in bootstrap before hydration.
8. Boot hydration reads only `abk:books`, all `meta` and `abk:settings` in one `multiGet`. Chapter text is loaded on demand by the player.

## Backup

- Export: JSON `{ schemaVersion, exportedAt, entries: Record<string, string> }` with all `abk:*` keys, no PDFs; share with `react-native-share`.
- Import: parse, validate every entry with its schema, migrate to current version, then write in one `multiSet`. Validate everything before writing anything.

## Testing

Repositories are tested against an in-memory `KeyValueStore` and `FileStore` implementing the same interfaces. Cover write order, crash resume, deletion with no orphans, corrupted values, oversized chapters and each migration.
