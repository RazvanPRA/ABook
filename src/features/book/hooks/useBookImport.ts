import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  continueImport,
  selectImportingBookId,
  selectImportPhase,
} from '@/features/import';
import type { BookMeta } from '@/shared/domain';
import { useBookDispatch } from './useBookDispatch';

/** The book's import: whether it runs now, how far it is, and how to continue it. */
export function useBookImport({ id, processedPages }: BookMeta) {
  const dispatch = useBookDispatch();
  const importingId = useSelector(selectImportingBookId);
  const phase = useSelector(selectImportPhase);
  const running = importingId === id;
  const livePage = running && phase.type === 'extracting' ? phase.page : 0;
  return {
    running,
    /** Some import runs: only one at a time. */
    busy: importingId !== null,
    /** The live page while pages come in; the meta moves once per chapter. */
    page: Math.max(processedPages, livePage),
    resume: useCallback(() => {
      dispatch(continueImport(id));
    }, [dispatch, id]),
  };
}
