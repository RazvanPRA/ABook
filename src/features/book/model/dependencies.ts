import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import type { ImportDependencies, ImportRootState } from '@/features/import';
import type {
  LibraryProgressRootState,
  LibraryRootState,
} from '@/features/library';
import type { AppDependencies } from '@/repositories';
import type { BookContentRootState } from '../state/contentSlice';
import type { BookDeletionRootState } from '../state/deletionSlice';

/** What the book thunks use of `extra`: a part of the app's `FeatureDependencies`. */
export type BookDependencies = ImportDependencies &
  Pick<AppDependencies, 'progressRepository'>;

/** The part of the root state this feature reads. */
export type BookRootState = BookContentRootState &
  BookDeletionRootState &
  ImportRootState &
  LibraryRootState &
  LibraryProgressRootState;

export type BookThunk<Result = void> = ThunkAction<
  Promise<Result>,
  BookRootState,
  BookDependencies,
  UnknownAction
>;
