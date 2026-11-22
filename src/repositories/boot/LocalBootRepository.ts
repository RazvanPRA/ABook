import { MIGRATIONS, runMigrations, type Migration } from '@/storage';
import type { BookStores } from '../book';
import { orderEntry } from '../book/bookOrder';
import type { BootRepository } from './BootRepository';
import { failUnresumableImports } from './failUnresumableImports';
import { loadBootSnapshot } from './loadBootSnapshot';
import { sweepOrphans } from './sweepOrphans';

/** `BootRepository` over the real stores; `migrations` is injectable for tests. */
export const createLocalBootRepository = (
  stores: BookStores,
  migrations: readonly Migration[] = MIGRATIONS,
): BootRepository => ({
  migrate: () => runMigrations(stores.kv, migrations),
  loadSnapshot: () => loadBootSnapshot(stores.kv),
  async repairOrder(snapshot) {
    if (!snapshot.orderValid) {
      await stores.kv.setMany(orderEntry(snapshot.order));
    }
  },
  failUnresumableImports: books => failUnresumableImports(stores, books),
  sweepOrphans: snapshot => sweepOrphans(stores, snapshot),
});
