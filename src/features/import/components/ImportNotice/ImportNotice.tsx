import React from 'react';
import { StyleSheet, View } from 'react-native';
import { space } from '@/shared/theme';
import { AppText, Button, Card } from '@/shared/ui';
import type { ImportPhase } from '../../model/types';
import { useImportNotice, type NoticeActions } from './useImportNotice';

interface ImportNoticeProps {
  phase: ImportPhase;
  /** Title of the library book a duplicate matches. */
  existingTitle: string;
  actions: NoticeActions;
}

/** A failure, a cancel or a duplicate, announced when it appears; nothing otherwise. */
export function ImportNotice({
  phase,
  existingTitle,
  actions,
}: ImportNoticeProps) {
  const notice = useImportNotice(phase, existingTitle, actions);
  if (notice === null) {
    return null;
  }
  const tone = phase.type === 'failed' ? 'danger' : 'text';
  return (
    <Card variant="raised" testID="import-notice">
      <View style={styles.body} accessibilityLiveRegion="polite">
        <AppText variant="bodyStrong" color={tone} accessibilityRole="header">
          {notice.title}
        </AppText>
        {notice.lines.map(line => (
          <AppText key={line} color="textMuted">
            {line}
          </AppText>
        ))}
        <View style={styles.actions}>
          {notice.actions.map(action => (
            <Button key={action.label} {...action} />
          ))}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.sm },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.sm,
  },
});
