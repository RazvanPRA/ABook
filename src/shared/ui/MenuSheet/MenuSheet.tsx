import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../AppText';
import { feedback } from '../feedback.styles';
import { Icon } from '../Icon';
import { sheet, SheetModal } from '../SheetModal';
import type { MenuItem, MenuSheetProps } from './MenuSheet.types';

/** The actions behind a "⋯" button, as a list over the dimmed screen. Choosing one closes it. */
export function MenuSheet({
  visible,
  title,
  items,
  closeLabel,
  onClose,
}: MenuSheetProps) {
  return (
    <SheetModal visible={visible} closeLabel={closeLabel} onClose={onClose}>
      {/* A menu container stays non-accessible, or TalkBack swallows the rows (M1) */}
      <View
        accessibilityRole="menu"
        accessibilityLabel={title}
        style={sheet.box}
      >
        <AppText variant="overline" color="textMuted" style={sheet.title}>
          {title}
        </AppText>
        {items.map(item => (
          <MenuRow key={item.key} item={item} onClose={onClose} />
        ))}
      </View>
    </SheetModal>
  );
}

function MenuRow({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const tint = item.tone === 'danger' ? 'danger' : 'text';
  return (
    <Pressable
      accessibilityRole="menuitem"
      accessibilityLabel={item.label}
      onPress={() => {
        onClose();
        item.onPress();
      }}
      style={({ pressed }) => [sheet.row, pressed && feedback.pressed]}
    >
      {item.icon ? <Icon name={item.icon} color={tint} /> : null}
      <AppText color={tint} style={sheet.rowLabel}>
        {item.label}
      </AppText>
    </Pressable>
  );
}
