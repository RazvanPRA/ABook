import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space } from '@/shared/theme';
import { PageSlider } from '../PageSlider';
import { PlayerOptions } from '../PlayerOptions';
import { TransportControls } from '../TransportControls';

/** Everything under the text. */
export const PlayerControls = memo(function PlayerControlsView({
  disabled,
}: {
  disabled: boolean;
}) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingBottom: bottom + space.lg }]}>
      <PageSlider disabled={disabled} />
      <TransportControls disabled={disabled} />
      <PlayerOptions />
    </View>
  );
});

const styles = StyleSheet.create({
  root: { gap: space.lg, paddingTop: space.sm },
});
