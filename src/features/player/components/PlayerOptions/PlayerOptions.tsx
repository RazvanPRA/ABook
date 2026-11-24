import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { space } from '@/shared/theme';
import { MenuSheet } from '@/shared/ui';
import { OptionButton } from './OptionButton';
import { usePlayerOptions } from './usePlayerOptions';

/** Speed, sleep timer and text size. */
export const PlayerOptions = memo(function PlayerOptionsView() {
  const { t } = useTranslation();
  const { menu, actions, rate, sleep, font } = usePlayerOptions();
  return (
    <View style={styles.row}>
      <OptionButton
        label={rate.label}
        accessibilityLabel={rate.spoken}
        onPress={actions.rate}
      />
      <OptionButton
        icon="moon"
        label={sleep.label}
        accessibilityLabel={sleep.spoken}
        active={sleep.active}
        onPress={actions.sleep}
      />
      <OptionButton
        label={font.label}
        accessibilityLabel={font.spoken}
        onPress={actions.font}
      />
      <MenuSheet
        visible={menu !== null}
        title={menu?.title ?? ''}
        items={menu?.items ?? []}
        closeLabel={t('player.options.close')}
        onClose={actions.close}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.md,
    paddingHorizontal: space.screenPadding,
  },
});
