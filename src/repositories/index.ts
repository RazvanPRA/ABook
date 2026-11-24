// Public API of repositories: interfaces for features (type-only imports), factories for app/dependencies.ts.
export type { AppDependencies } from './AppDependencies';
export { createLocalBookRepository } from './book';
export type {
  BookMetaPatch,
  BookRepository,
  BookStores,
  StoredPdf,
} from './book';
export { createLocalBootRepository } from './boot';
export type { BootRepository, BootSnapshot, OrphanSweep } from './boot';
export { createLocalProgressRepository } from './progress';
export type { ProgressByBook, ProgressRepository } from './progress';
export { createLocalSettingsRepository } from './settings';
export type { SettingsRepository } from './settings';
