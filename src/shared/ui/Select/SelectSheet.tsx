import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { AppText } from '../AppText';
import { feedback } from '../feedback.styles';
import { Icon } from '../Icon';
import { styles } from './Select.styles';
import type { SelectItem } from './Select.types';

interface SelectSheetProps<T extends string> {
  visible: boolean;
  title: string;
  items: readonly SelectItem<T>[];
  closeLabel: string;
  onClose: () => void;
}

/**
 * The open list of a `Select`: a dialog over a dimmed screen, one radio row per option. The back
 * button and the backdrop close it without changing the value.
 */
export function SelectSheet<T extends string>({
  visible,
  title,
  items,
  closeLabel,
  onClose,
}: SelectSheetProps<T>) {
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
        {/* A radiogroup container stays non-accessible, or TalkBack swallows the rows (M1) */}
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={title}
          style={styles.sheet}
        >
          <AppText variant="overline" color="textMuted" style={styles.title}>
            {title}
          </AppText>
          {items.map(item => (
            <Pressable
              key={item.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: item.selected }}
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.option,
                pressed && feedback.pressed,
              ]}
            >
              <AppText
                variant={item.selected ? 'bodyStrong' : 'body'}
                style={styles.optionLabel}
              >
                {item.label}
              </AppText>
              {item.selected ? <Icon name="check" color="accent" /> : null}
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}
