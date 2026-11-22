import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { space } from '@/shared/theme';
import { AppText, Button, Card, Icon } from '@/shared/ui';

/** Before a file is picked: what the import does, and the button that opens the picker. */
export function ImportPickCard({ onPick }: { onPick: () => void }) {
  const { t } = useTranslation();
  return (
    <Card>
      <View style={styles.body}>
        <Icon name="upload" size="xl" color="accent" />
        <AppText variant="bodyStrong" accessibilityRole="header">
          {t('import.pick.title')}
        </AppText>
        <AppText color="textMuted" align="center">
          {t('import.pick.detail')}
        </AppText>
        <Button label={t('import.pick.action')} icon="plus" onPress={onPick} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', gap: space.md, paddingVertical: space.lg },
});
