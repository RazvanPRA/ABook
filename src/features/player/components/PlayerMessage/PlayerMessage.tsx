import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { space } from '@/shared/theme';
import { Button, EmptyState } from '@/shared/ui';
import { TextCard } from '../TextCard';
import type { PlayerMessage as Message } from './usePlayerMessage';

/** In place of the text, when it can't be read on. Scrolls on a small screen. */
export function PlayerMessage({
  message: { main, other },
}: {
  message: Message;
}) {
  return (
    <TextCard>
      <ScrollView contentContainerStyle={styles.content}>
        <EmptyState {...main} />
        {other ? (
          <View style={styles.other}>
            <Button variant="ghost" {...other} />
          </View>
        ) : null}
      </ScrollView>
    </TextCard>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  other: { alignItems: 'center', paddingBottom: space.lg },
});
