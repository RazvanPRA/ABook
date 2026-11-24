import type { BookId, BookMeta, Settings } from '@/shared/domain';
import type { MigrationOutcome } from '@/storage';

/** Everything the app needs before the first screen, read with one `getMany` (storage rule 8). */
export interface BootSnapshot {
  /** Library order, books with a valid meta only. */
  books: BookMeta[];
  settings: Settings;
  /** `abk:books` as stored (ids may lack a meta), or rebuilt from the metas when it is invalid. */
  order: BookId[];
  /**
   * `false` when `abk:books` exists but is invalid. The order is then rebuilt (and must be saved
   * with `repairOrder`), and nothing may be treated as an orphan during this boot.
   */
  orderValid: boolean;
  /** Every `abk:*` key at boot, for the orphan sweep. */
  keys: string[];
}

export interface OrphanSweep {
  keys: number;
  files: number;
}

/** The storage side of `app/bootstrap.ts`; not exposed to features. */
export interface BootRepository {
  migrate(): Promise<MigrationOutcome>;
  loadSnapshot(): Promise<BootSnapshot>;
  /**
   * Saves the rebuilt order when `abk:books` was invalid; a no-op otherwise. Without it, the next
   * `createBook` would replace the unreadable order with the new book alone, orphaning the others.
   */
  repairOrder(snapshot: BootSnapshot): Promise<void>;
  /**
   * Marks `failed` the books a killed import left `processing` whose PDF is gone (one batch); the
   * others stay `processing`, to be resumed. Returns the books.
   */
  failUnresumableImports(books: readonly BookMeta[]): Promise<BookMeta[]>;
  /** Removes keys and PDFs of books that are not in the library (an interrupted delete or import). */
  sweepOrphans(snapshot: BootSnapshot): Promise<OrphanSweep>;
}
