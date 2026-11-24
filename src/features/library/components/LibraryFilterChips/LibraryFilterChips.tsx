import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { ChipGroup, type ChipOption } from '@/shared/ui';
import { BOOK_FILTERS, type BookFilter } from '../../model/types';
import { filterChanged, selectLibraryFilter } from '../../state/filterSlice';

/** Toate / În curs / Terminate. */
export function LibraryFilterChips() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { filter } = useSelector(selectLibraryFilter);
  const options = useMemo<ChipOption<BookFilter>[]>(
    () =>
      BOOK_FILTERS.map(value => ({
        value,
        label: t(`library.filter.${value}`),
      })),
    [t],
  );
  const change = useCallback(
    (value: BookFilter) => dispatch(filterChanged(value)),
    [dispatch],
  );
  return (
    <ChipGroup
      options={options}
      value={filter}
      onChange={change}
      accessibilityLabel={t('library.filter.label')}
    />
  );
}
