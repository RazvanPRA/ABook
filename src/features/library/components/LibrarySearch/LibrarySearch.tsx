import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { space } from '@/shared/theme';
import { SearchField } from '@/shared/ui';
import { useLibrarySearch } from '../../hooks/useLibrarySearch';

/** The search box, above the list so it keeps the focus while the list changes. */
export function LibrarySearch() {
  const { t } = useTranslation();
  const { text, change } = useLibrarySearch();
  return (
    <View style={styles.root}>
      <SearchField
        value={text}
        onChangeText={change}
        label={t('library.search.label')}
        clearLabel={t('library.search.clear')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: space.screenPadding,
    paddingBottom: space.md,
  },
});
