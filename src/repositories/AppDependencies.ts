import type { BookRepository } from './book';
import type { ProgressRepository } from './progress';
import type { SettingsRepository } from './settings';

/**
 * What features may reach in storage, injected once in `app/dependencies.ts` and handed to RTK
 * thunks as their `extra` argument. Features import this type only, never an implementation.
 */
export interface AppDependencies {
  bookRepository: BookRepository;
  progressRepository: ProgressRepository;
  settingsRepository: SettingsRepository;
}
