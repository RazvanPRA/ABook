import React, { type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { space } from '@/shared/theme';
import { AppText, Button, Card, type ButtonProps } from '@/shared/ui';

type BookBannerProps = PropsWithChildren<{
  title: string;
  lines: readonly string[];
  tone?: 'default' | 'danger';
  action?: Pick<ButtonProps, 'label' | 'onPress' | 'disabled'>;
}>;

/** What happened to the book's import, over the rest of the screen. */
export function BookBanner({
  title,
  lines,
  tone = 'default',
  action,
  children,
}: BookBannerProps) {
  return (
    <Card variant="raised" testID="book-banner">
      <View style={styles.body}>
        <AppText
          variant="bodyStrong"
          color={tone === 'danger' ? 'danger' : 'text'}
          accessibilityRole="header"
        >
          {title}
        </AppText>
        {lines.map(line => (
          <AppText key={line} color="textMuted">
            {line}
          </AppText>
        ))}
        {children}
        {action ? <Button variant="secondary" {...action} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.sm },
});
