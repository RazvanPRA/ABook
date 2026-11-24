import { createSelector } from '@reduxjs/toolkit';
import { deriveSteps, isActivePhase } from '../model/steps';
import type { ImportFailure, ImportPhase, ImportStep } from '../model/types';
import type { ImportState } from './importState';

/** The part of the root state this feature reads; the app's store must mount it at `import`. */
export interface ImportRootState {
  import: ImportState;
}

export const selectImport = (state: ImportRootState): ImportState =>
  state.import;

export const selectImportPhase = (state: ImportRootState): ImportPhase =>
  state.import.phase;

/** Memoized: the same array until the phase changes. */
export const selectImportSteps: (state: ImportRootState) => ImportStep[] =
  createSelector([selectImportPhase], deriveSteps);

/** An import is running, or waiting for the user's answer on a duplicate. */
export const selectIsImporting = (state: ImportRootState): boolean =>
  isActivePhase(state.import.phase);

/** Why the import stopped, `null` unless it failed. */
export const selectImportFailure = (
  state: ImportRootState,
): ImportFailure | null => {
  const { phase } = state.import;
  return phase.type === 'failed' ? phase.reason : null;
};

/** The first chapter is in storage, so the book can be listened to before the import ends. */
export const selectCanListen = (state: ImportRootState): boolean => {
  const { phase, chaptersSaved } = state.import;
  return chaptersSaved > 0 && (isActivePhase(phase) || phase.type === 'ready');
};

/** "Adaugă în bibliotecă" is enabled: an import running or done, a title, not yet submitted. */
export const selectCanSubmit = (state: ImportRootState): boolean => {
  const { phase, form, submitted } = state.import;
  const running = isActivePhase(phase) && phase.type !== 'duplicate';
  return (
    (running || phase.type === 'ready') &&
    !submitted &&
    form.title.trim() !== ''
  );
};

/** Share of pages extracted, 0…1; 0 before the PDF is open, 1 once extraction is over. */
export const selectExtractProgress = (state: ImportRootState): number => {
  const { phase } = state.import;
  if (phase.type === 'extracting') {
    return phase.total === 0 ? 0 : phase.page / phase.total;
  }
  return ['splitting', 'saving', 'ready'].includes(phase.type) ? 1 : 0;
};
