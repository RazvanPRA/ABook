import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import type { ImportDependencies } from '../model/dependencies';
import type { ImportRootState } from '../state/selectors';

/** Dispatch that accepts the import thunks (the app store's dispatch satisfies it). */
export type ImportDispatch = ThunkDispatch<
  ImportRootState,
  ImportDependencies,
  UnknownAction
>;

export const useImportDispatch = (): ImportDispatch =>
  useDispatch<ImportDispatch>();
