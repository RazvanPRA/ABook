import type { UnknownAction } from '@reduxjs/toolkit';
import type { AppDependencies } from '@/repositories';
import type { PdfTextExtractor } from '@/services/pdf';
import type { PdfPicker } from '@/services/picker';
import type { BookId } from '@/shared/domain';
import type { ImportForm } from './types';

/** What the import thunks use of `extra`: a part of the app's `FeatureDependencies`. */
export type ImportDependencies = Pick<AppDependencies, 'bookRepository'> & {
  pdfExtractor: PdfTextExtractor;
  pdfPicker: PdfPicker;
};

/** Everything `runImport` uses, injected so the pipeline runs in tests without the store's thunk. */
export interface ImportContext {
  readonly bookRepository: AppDependencies['bookRepository'];
  readonly pdfExtractor: PdfTextExtractor;
  readonly dispatch: (action: UnknownAction) => unknown;
  /** The form as it is now: the user may edit it while the import runs. */
  readonly getForm: () => ImportForm;
  readonly newBookId: () => BookId;
  readonly now: () => Date;
  /** The user cancelled: the pipeline stops at its next step (`throwIfCancelled`). */
  readonly isCancelled: () => boolean;
  /** Frees the JS thread after the CPU-heavy work of a chapter (cleanup + segmentation). */
  readonly yieldToJs: () => Promise<void>;
}
