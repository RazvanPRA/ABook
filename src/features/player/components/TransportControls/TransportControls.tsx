import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { space } from '@/shared/theme';
import { IconButton } from '@/shared/ui';
import { useTransport } from './useTransport';

/** Page ←, sentence ←, play / pause, sentence →, page →. */
export const TransportControls = memo(function TransportControlsView({
  disabled,
}: {
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const { playing, can, actions } = useTransport();
  return (
    <View style={styles.row}>
      <IconButton
        icon="skip-back"
        accessibilityLabel={t('player.page.previous')}
        onPress={actions.previousPage}
        disabled={disabled || !can.previousPage}
      />
      <IconButton
        icon="rotate-ccw"
        accessibilityLabel={t('player.sentence.previous')}
        onPress={actions.previousSentence}
        disabled={disabled || !can.previousSentence}
      />
      <IconButton
        icon={playing ? 'pause' : 'play'}
        variant="filled"
        accessibilityLabel={t(playing ? 'player.pause' : 'player.play')}
        onPress={actions.toggle}
        disabled={disabled}
      />
      <IconButton
        icon="rotate-cw"
        accessibilityLabel={t('player.sentence.next')}
        onPress={actions.nextSentence}
        disabled={disabled || !can.nextSentence}
      />
      <IconButton
        icon="skip-forward"
        accessibilityLabel={t('player.page.next')}
        onPress={actions.nextPage}
        disabled={disabled || !can.nextPage}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.screenPadding,
  },
});
