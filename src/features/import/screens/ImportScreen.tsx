import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { color, space } from '@/shared/theme';
import { ScreenHeader } from '@/shared/ui';
import { BookDetailsForm } from '../components/BookDetailsForm';
import { ImportFileCard } from '../components/ImportFileCard';
import { ImportFooter } from '../components/ImportFooter';
import { ImportNotice } from '../components/ImportNotice';
import { ImportPickCard } from '../components/ImportPickCard';
import { ImportSteps } from '../components/ImportSteps';
import { useImportScreen } from '../hooks/useImportScreen';

export interface ImportScreenProps {
  /** Closes the modal (the app passes `navigation.goBack`). */
  onClose: () => void;
}

/**
 * "Importă PDF" (mockup 02): the picked file, the local processing steps, a failure, cancel or
 * duplicate notice, and the book details form. Closing it leaves the import running.
 */
export function ImportScreen({ onClose }: ImportScreenProps) {
  const { t } = useTranslation();
  const model = useImportScreen(onClose);
  const { file, phase, pageCount } = model.state;
  const showForm = file !== null && !model.stopped;
  const noticeActions = useMemo(
    () => ({
      onPick: model.pick,
      onKeep: model.keep,
      onDiscard: model.cancel,
    }),
    [model.pick, model.keep, model.cancel],
  );
  return (
    <View style={styles.screen} testID="screen-import">
      <ScreenHeader
        title={t('import.title')}
        back={{
          icon: 'chevron-left',
          accessibilityLabel: t('import.back'),
          onPress: onClose,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {file === null ? (
          <ImportPickCard onPick={model.pick} />
        ) : (
          <ImportFileCard
            file={file}
            pageCount={pageCount}
            onChange={model.pick}
          />
        )}
        {file !== null ? <ImportSteps steps={model.steps} /> : null}
        <ImportNotice
          phase={phase}
          existingTitle={model.existingTitle}
          actions={noticeActions}
        />
        {showForm ? <BookDetailsForm /> : null}
      </ScrollView>
      {showForm ? (
        <ImportFooter
          canSubmit={model.canSubmit}
          running={model.running}
          onSubmit={model.submit}
          onCancel={model.cancel}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: {
    gap: space.cardGap,
    paddingHorizontal: space.screenPadding,
    paddingBottom: space.xxl,
  },
});
