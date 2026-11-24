import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import type { BookDependencies, BookRootState } from '../model/dependencies';

/** Dispatch that accepts the book and import thunks (the app store's dispatch satisfies it). */
export const useBookDispatch = () =>
  useDispatch<ThunkDispatch<BookRootState, BookDependencies, UnknownAction>>();
