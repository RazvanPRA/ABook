import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { space } from '@/shared/theme';
import { AppText, Button } from '@/shared/ui';
import { queryChanged, selectLibraryFilter } from '../../state/filterSlice';

/** Nothing matches: the search can be cleared here; an empty filter just says so. */
export function NoResults() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { query, filter } = useSelector(selectLibraryFilter);
  const clear = useCallback(() => dispatch(queryChanged('')), [dispatch]);
  const searching = query.trim() !== '';
  const emptyFilter =
    filter === 'finished'
      ? t('library.noResults.finished')
      : t('library.noResults.reading');
  return (
    <View style={styles.root} accessibilityLiveRegion="polite">
      <AppText color="textMuted" align="center">
        {searching
          ? t('library.noResults.search', { query: query.trim() })
          : emptyFilter}
      </AppText>
      {searching ? (
        <Button
          variant="ghost"
          label={t('library.search.clear')}
          onPress={clear}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: space.md, paddingVertical: space.xxl },
});
