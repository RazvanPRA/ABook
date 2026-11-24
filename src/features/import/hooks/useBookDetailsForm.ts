import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { formChanged } from '../state/importSlice';
import { selectImport } from '../state/selectors';
import { useImportDispatch } from './useImportDispatch';

/** The "Detalii carte" form: values from the import slice, edits dispatched back to it. */
export function useBookDetailsForm() {
  const { t } = useTranslation();
  const dispatch = useImportDispatch();
  const { form } = useSelector(selectImport);
  return {
    form,
    titleError:
      form.title.trim() === '' ? t('import.form.titleRequired') : null,
    changeTitle: useCallback(
      (value: string) => dispatch(formChanged({ field: 'title', value })),
      [dispatch],
    ),
    changeAuthor: useCallback(
      (value: string) => dispatch(formChanged({ field: 'author', value })),
      [dispatch],
    ),
  };
}
