import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { space } from '@/shared/theme';
import { AppText, Select, TextField } from '@/shared/ui';
import type { BookLanguage } from '@/shared/domain';
import { useBookDetailsForm } from '../../hooks/useBookDetailsForm';

/** "Detalii carte": title, author and the voice language, editable while the import runs. */
export function BookDetailsForm() {
  const { t } = useTranslation();
  const form = useBookDetailsForm();
  return (
    <View style={styles.form}>
      <AppText variant="overline" color="textMuted" accessibilityRole="header">
        {t('import.form.title')}
      </AppText>
      <TextField
        label={t('import.form.bookTitle')}
        value={form.form.title}
        onChangeText={form.changeTitle}
        error={form.titleError}
      />
      <TextField
        label={t('import.form.author')}
        value={form.form.author}
        onChangeText={form.changeAuthor}
        placeholder={t('import.form.authorPlaceholder')}
      />
      <Select<BookLanguage>
        label={t('import.form.language')}
        options={form.languages}
        value={form.form.language}
        onChange={form.changeLanguage}
        closeLabel={t('import.form.close')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.lg },
});
