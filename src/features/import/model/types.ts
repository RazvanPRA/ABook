import type { BookId, BookLanguage } from '@/shared/domain';

/** The file the user picked, as the picker describes it. */
export interface PickedFile {
  readonly name: string;
  /** What the platform can read (`content://…` on Android, a path on iOS). */
  readonly uri: string;
  readonly sizeBytes: number;
}

/** Why an import stopped. The UI explains each; `password` and `corrupt` come from pdf.js. */
export const IMPORT_FAILURES = [
  'too-large',
  'copy',
  'scanned',
  'password',
  'corrupt',
  'timeout',
  'storage',
  'unknown',
] as const;

export type ImportFailure = (typeof IMPORT_FAILURES)[number];

/** The four steps the import screen lists (mockup 02-import-pdf.png). */
export const IMPORT_STEP_IDS = ['copy', 'extract', 'split', 'save'] as const;

export type ImportStepId = (typeof IMPORT_STEP_IDS)[number];

/**
 * Where the import is. `duplicate` waits for the user (keep a copy or cancel); `failed` and
 * `cancelled` remember the step they stopped at, for the step list.
 */
export type ImportPhase =
  | { readonly type: 'idle' }
  | { readonly type: 'copying' }
  | { readonly type: 'duplicate'; readonly existingBookId: BookId }
  | { readonly type: 'opening' }
  | {
      readonly type: 'extracting';
      readonly page: number;
      readonly total: number;
    }
  | { readonly type: 'splitting' }
  | { readonly type: 'saving' }
  | { readonly type: 'ready' }
  | {
      readonly type: 'failed';
      readonly reason: ImportFailure;
      readonly step: ImportStepId;
    }
  | { readonly type: 'cancelled'; readonly step: ImportStepId };

export type ImportPhaseType = ImportPhase['type'];

/** The form under the step list; metadata from the PDF fills the fields the user hasn't edited. */
export interface ImportForm {
  readonly title: string;
  readonly author: string;
  readonly language: BookLanguage;
}

export type ImportFormField = 'title' | 'author';

export type StepStatus = 'done' | 'active' | 'waiting' | 'error';

/** One row of the step list; `progress` only on the extract step while pages come in. */
export interface ImportStep {
  readonly id: ImportStepId;
  readonly status: StepStatus;
  readonly progress: { readonly page: number; readonly total: number } | null;
}
