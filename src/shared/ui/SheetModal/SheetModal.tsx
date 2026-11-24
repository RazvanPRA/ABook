import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { styles } from './SheetModal.styles';
import type { SheetModalProps } from './SheetModal.types';

/**
 * A dialog over a dimmed screen, the shell of `Select`, `MenuSheet` and `ConfirmDialog`. The back
 * button and the backdrop close it.
 */
export function SheetModal({
  visible,
  closeLabel,
  onClose,
  children,
}: SheetModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          onPress={onClose}
          style={styles.scrim}
        />
        {children}
      </View>
    </Modal>
  );
}
