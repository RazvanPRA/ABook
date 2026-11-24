import React from 'react';
import { StyleSheet, View } from 'react-native';
import { space } from '@/shared/theme';
import { AppText } from '../AppText';
import { Button } from '../Button';
import { sheet, SheetModal } from '../SheetModal';
import type { ConfirmDialogProps } from './ConfirmDialog.types';

/** Asks before something that can't be undone. */
export function ConfirmDialog({
  visible,
  title,
  lines,
  confirm,
  cancel,
}: ConfirmDialogProps) {
  return (
    <SheetModal
      visible={visible}
      closeLabel={cancel.label}
      onClose={cancel.onPress}
    >
      <View style={[sheet.box, styles.box]}>
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
        {lines.map(line => (
          <AppText key={line} color="textMuted">
            {line}
          </AppText>
        ))}
        <View style={styles.actions}>
          <Button variant="danger" {...confirm} />
          <Button variant="ghost" {...cancel} />
        </View>
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  box: { gap: space.md },
  actions: { gap: space.sm, marginTop: space.sm },
});
