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
  createWebViewPdfExtractor,
  createWebViewTransport,
  type PdfTextExtractor,
  type WebViewTransport,
} from '@/services/pdf';
import {
  createAsyncStorageKeyValueStore,
  createReactNativeFsFileStore,
} from '@/storage';

/**
 * What thunks get as `extra`: the repositories plus the services that need wiring. Repositories
 * can't see services, so the PDF extractor is added here, not in `AppDependencies`; a feature
 * declares the part it uses (e.g. `AppDependencies & { pdfExtractor }`).
 */
export interface FeatureDependencies extends AppDependencies {
  pdfExtractor: PdfTextExtractor;
}

/** Everything the app wires: what features get plus what only `app/` uses. */
export interface AppServices extends FeatureDependencies {
  bootRepository: BootRepository;
  /** The raw stores, for dev tools in `app/dev` only (abook://dev/storage). */
  stores: BookStores;
  /** The extractor's WebView side, rendered by `PdfExtractorHost`. */
  pdfTransport: WebViewTransport;
}

/** The only place where implementations are bound to interfaces (PROMPT §3). */
export const createAppServices = (
  stores: BookStores = {
    kv: createAsyncStorageKeyValueStore(),
    files: createReactNativeFsFileStore(),
  },
): AppServices => {
  const pdfTransport = createWebViewTransport();
  return {
    bookRepository: createLocalBookRepository(stores),
    progressRepository: createLocalProgressRepository(stores),
    settingsRepository: createLocalSettingsRepository(stores),
    bootRepository: createLocalBootRepository(stores),
    pdfExtractor: createWebViewPdfExtractor({
      transport: pdfTransport,
      readChunk: (path, offset, length) =>
        stores.files.readBase64(path, offset, length),
    }),
    stores,
    pdfTransport,
  };
};

let appServices: AppServices | undefined;

/** The real services, created once on first use. */
export const getAppServices = (): AppServices => {
  appServices ??= createAppServices();
  return appServices;
};

/** Features see only the interfaces; the boot repository and the raw stores stay in `app/`. */
export const featureDependencies = ({
  bookRepository,
  progressRepository,
  settingsRepository,
  pdfExtractor,
}: AppServices): FeatureDependencies => ({
  bookRepository,
  progressRepository,
  settingsRepository,
  pdfExtractor,
});
