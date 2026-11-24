import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { BOOK_LANGUAGES, type BookLanguage } from '@/shared/domain';
import type { SelectOption } from '@/shared/ui';
import { formChanged, languageChanged } from '../state/importSlice';
import { selectImport } from '../state/selectors';
import { useImportDispatch } from './useImportDispatch';

/** The "Detalii carte" form: values from the import slice, edits dispatched back to it. */
export function useBookDetailsForm() {
  const { t } = useTranslation();
  const dispatch = useImportDispatch();
  const { form } = useSelector(selectImport);
  const languages = useMemo<SelectOption<BookLanguage>[]>(
    () =>
      BOOK_LANGUAGES.map(value => ({
        value,
        label: t(`import.languages.${value}`),
      })),
    [t],
  );
  return {
    form,
    languages,
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
    changeLanguage: useCallback(
      (value: BookLanguage) => dispatch(languageChanged(value)),
      [dispatch],
    ),
  };
}
