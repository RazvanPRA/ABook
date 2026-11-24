import type { StoredPdf } from '@/repositories';
import type { BookId } from '@/shared/domain';
import type {
  ImportForm,
  ImportFormField,
  ImportPhase,
  PickedFile,
} from '../model/types';

export interface ImportState {
  readonly phase: ImportPhase;
  readonly bookId: BookId | null;
  readonly file: PickedFile | null;
  /** The app's copy of the file, once copied: a kept duplicate continues from it. */
  readonly stored: StoredPdf | null;
  readonly pageCount: number;
  /** Chapters already in storage: the book is playable from the first one. */
  readonly chaptersSaved: number;
  readonly form: ImportForm;
  /** Fields the user typed in, which PDF metadata must not overwrite. */
  readonly edited: Readonly<Record<ImportFormField, boolean>>;
  /** "Adaugă în bibliotecă" was pressed: the form is saved into the book's meta. */
  readonly submitted: boolean;
  /** Resumed at boot: if it fails, the book and its saved chapters stay in the library. */
  readonly resumed: boolean;
}

export interface ResumedImport {
  readonly bookId: BookId;
  readonly file: PickedFile;
  readonly form: ImportForm;
  readonly chaptersSaved: number;
  /** The PDF was opened before the kill: the form already holds its metadata, or the user's edits. */
  readonly metadataRead: boolean;
}

export const initialImportState: ImportState = {
  phase: { type: 'idle' },
  bookId: null,
  file: null,
  stored: null,
  pageCount: 0,
  chaptersSaved: 0,
  form: { title: '', author: '' },
  edited: { title: false, author: false },
  submitted: false,
  resumed: false,
};
