// Public API of repositories: interfaces for features (type-only imports), factories for app/dependencies.ts.
export { createLocalBookRepository } from './book';
export type {
  BookMetaPatch,
  BookRepository,
  BookStores,
  StoredPdf,
} from './book';
