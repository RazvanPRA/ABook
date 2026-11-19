import {
  createLocalBookRepository,
  createLocalBootRepository,
  createLocalProgressRepository,
  createLocalSettingsRepository,
  type AppDependencies,
  type BookStores,
  type BootRepository,
} from '@/repositories';
import {
  createAsyncStorageKeyValueStore,
  createReactNativeFsFileStore,
} from '@/storage';

/** Everything the app wires: what features get (`AppDependencies`) plus what only `app/` uses. */
export interface AppServices extends AppDependencies {
  bootRepository: BootRepository;
}

/** The only place where implementations are bound to interfaces (PROMPT §3). */
export const createAppServices = (
  stores: BookStores = {
    kv: createAsyncStorageKeyValueStore(),
    files: createReactNativeFsFileStore(),
  },
): AppServices => ({
  bookRepository: createLocalBookRepository(stores),
  progressRepository: createLocalProgressRepository(stores),
  settingsRepository: createLocalSettingsRepository(stores),
  bootRepository: createLocalBootRepository(stores),
});

let appServices: AppServices | undefined;

/** The real services, created once on first use. */
export const getAppServices = (): AppServices => {
  appServices ??= createAppServices();
  return appServices;
};

/** Features see only the repository interfaces; the boot repository stays in `app/`. */
export const featureDependencies = ({
  bookRepository,
  progressRepository,
  settingsRepository,
}: AppServices): AppDependencies => ({
  bookRepository,
  progressRepository,
  settingsRepository,
});
