import React, { type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { space } from '@/shared/theme';
import { AppText } from '@/shared/ui';

/** "CUPRINS", "SEMNE DE CARTE": an overline title over its rows. */
export function BookSection({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.root}>
      <AppText variant="overline" color="textMuted" accessibilityRole="header">
        {title}
      </AppText>
      <View>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.sm },
});
