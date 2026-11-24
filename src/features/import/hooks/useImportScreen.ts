import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectBookById, type LibraryRootState } from '@/features/library';
import { isActivePhase } from '../model/steps';
import type { ImportPhaseType } from '../model/types';
import { importReset } from '../state/importSlice';
import { pickPdf, submitImport } from '../state/screenThunks';
import {
  selectCanSubmit,
  selectImport,
  selectImportSteps,
  type ImportRootState,
} from '../state/selectors';
import { cancelImport, keepDuplicate } from '../state/thunks';
import { useImportDispatch } from './useImportDispatch';

type ScreenState = ImportRootState & LibraryRootState;

const STOPPED: readonly ImportPhaseType[] = [
  'failed',
  'cancelled',
  'duplicate',
];

/**
 * Everything the import screen shows and does. A finished import (ready or cancelled) is cleared
 * when the screen opens; a failure stays, so its reason is seen even if it happened in the
 * background. The screen closes once the user submits the form.
 */
export function useImportScreen(onClose: () => void) {
  const dispatch = useImportDispatch();
  const state = useSelector(selectImport);
  const steps = useSelector(selectImportSteps);
  const canSubmit = useSelector(selectCanSubmit);
  const { phase, submitted } = state;
  const existingTitle = useSelector((root: ScreenState) =>
    phase.type === 'duplicate'
      ? (selectBookById(root, phase.existingBookId)?.title ?? '')
      : '',
  );

  useEffect(() => {
    if (phase.type === 'ready' || phase.type === 'cancelled') {
      dispatch(importReset());
    }
    // Only when the screen opens: later phases are what the user is looking at
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wasSubmitted = useRef(submitted);
  useEffect(() => {
    if (submitted && !wasSubmitted.current) {
      onClose();
    }
    wasSubmitted.current = submitted;
  }, [submitted, onClose]);

  return {
    state,
    steps,
    canSubmit,
    existingTitle,
    running: isActivePhase(phase) && phase.type !== 'duplicate',
    /** A failure, a cancel or a duplicate is shown instead of the form. */
    stopped: STOPPED.includes(phase.type),
    pick: useCallback(() => {
      dispatch(pickPdf());
    }, [dispatch]),
    cancel: useCallback(() => {
      dispatch(cancelImport());
    }, [dispatch]),
    keep: useCallback(() => {
      dispatch(keepDuplicate());
    }, [dispatch]),
    submit: useCallback(() => {
      dispatch(submitImport());
    }, [dispatch]),
  };
}

export type ImportScreenModel = ReturnType<typeof useImportScreen>;
