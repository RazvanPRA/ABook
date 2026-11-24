import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { space } from '@/shared/theme';
import { AppText, TextField } from '@/shared/ui';
import { useBookDetailsForm } from '../../hooks/useBookDetailsForm';

/** "Detalii carte": title and author, editable while the import runs. */
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
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.lg },
});
