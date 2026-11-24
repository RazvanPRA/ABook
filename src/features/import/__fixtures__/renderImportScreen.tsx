import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react-native';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { libraryReducer } from '@/features/library';
import { FakePdfTextExtractor, type FakePdf } from '@/services/pdf/testing';
import { FakePdfPicker } from '@/services/picker/testing';
import { i18n } from '@/shared/i18n';
import type { ImportDependencies } from '../model/dependencies';
import { ImportScreen } from '../screens/ImportScreen';
import { importReducer } from '../state/importSlice';
import { book } from './importSetup';
import { MemoryBookRepository } from './memoryBookRepository';

/** A store over in-memory fakes; every opened path gets `pdf` (book ids are uuids). */
export function createScreenStore(pdf: FakePdf = { pages: book(30) }) {
  const repo = new MemoryBookRepository();
  const extractor = new FakePdfTextExtractor();
  const picker = new FakePdfPicker();
  const open = extractor.open.bind(extractor);
  jest.spyOn(extractor, 'open').mockImplementation(path => {
    extractor.addPdf(path, pdf);
    return open(path);
  });
  const extra: ImportDependencies = {
    bookRepository: repo,
    pdfExtractor: extractor,
    pdfPicker: picker,
  };
  const store = configureStore({
    reducer: { import: importReducer, library: libraryReducer },
    middleware: getDefault => getDefault({ thunk: { extraArgument: extra } }),
  });
  return { store, repo, extractor, picker };
}

export type ScreenStore = ReturnType<typeof createScreenStore>;

/** The import screen with its store and the real Romanian texts. */
export async function renderImportScreen(
  setup: ScreenStore = createScreenStore(),
) {
  const onClose = jest.fn();
  const view = await render(
    <Provider store={setup.store}>
      <I18nextProvider i18n={i18n}>
        <ImportScreen onClose={onClose} />
      </I18nextProvider>
    </Provider>,
  );
  return { ...setup, view, onClose };
}
