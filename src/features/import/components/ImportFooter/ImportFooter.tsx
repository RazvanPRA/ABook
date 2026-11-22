import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, space } from '@/shared/theme';
import { AppText, Button } from '@/shared/ui';

interface ImportFooterProps {
  canSubmit: boolean;
  /** An import runs: it can be cancelled. */
  running: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

/** "Adaugă în bibliotecă", the note that listening can start early, and the cancel while running. */
export function ImportFooter({
  canSubmit,
  running,
  onSubmit,
  onCancel,
}: ImportFooterProps) {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();
  const safeBottom = useMemo(
    () => ({ paddingBottom: bottom + space.md }),
    [bottom],
  );
  return (
    <View style={[styles.footer, safeBottom]}>
      <Button
        label={t('import.submit')}
        size="lg"
        onPress={onSubmit}
        disabled={!canSubmit}
      />
      <AppText variant="caption" color="textMuted" align="center">
        {t('import.note')}
      </AppText>
      {running ? (
        <Button label={t('import.cancel')} variant="ghost" onPress={onCancel} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: space.sm,
    paddingTop: space.md,
    paddingHorizontal: space.screenPadding,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.divider,
    backgroundColor: color.bg,
  },
});
