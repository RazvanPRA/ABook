import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BookId } from '@/shared/domain';
import { color } from '@/shared/theme';
import { EmptyState } from '@/shared/ui';
import { PlayerBody } from '../components/PlayerBody';
import { PlayerControls } from '../components/PlayerControls';
import { PlayerHeader } from '../components/PlayerHeader';
import { PlayerNotices } from '../components/PlayerNotices';
import { usePlaybackSession } from '../hooks/usePlaybackSession';
import { usePlayerBookmarks } from '../hooks/usePlayerBookmarks';
import { useRestorePlayback } from '../hooks/useRestorePlayback';

export interface PlayerScreenProps {
  /** Back to the tab it was opened from. */
  onClose: () => void;
  onLibrary: () => void;
  onOpenBook: (id: BookId) => void;
}

/** "Ascultă": the book being read aloud (mockup 04). */
export function PlayerScreen({
  onClose,
  onLibrary,
  onOpenBook,
}: PlayerScreenProps) {
  const { t } = useTranslation();
  const restoring = useRestorePlayback();
  const { view: shown, bookId, voiceReplaced, actions } = usePlaybackSession();
  const bookmarks = usePlayerBookmarks();
  const view = shown === 'empty' && restoring ? 'loading' : shown;
  if (view === 'empty') {
    return (
      <View style={styles.screen} testID="screen-player">
        <EmptyState
          icon="headphones"
          title={t('player.empty.title')}
          description={t('player.empty.detail')}
          action={{ label: t('player.empty.action'), onPress: onLibrary }}
        />
      </View>
    );
  }
  return (
    <View style={styles.screen} testID="screen-player">
      <PlayerHeader onClose={onClose} bookmark={bookmarks} />
      <View style={styles.body}>
        <PlayerBody
          view={view}
          bookId={bookId}
          actions={actions}
          onBookmark={bookmarks.add}
          onOpenBook={onOpenBook}
        />
        <PlayerNotices
          bookmark={bookmarks.notice}
          voiceReplaced={voiceReplaced}
          onVoiceShown={actions.acknowledgeVoice}
        />
      </View>
      <PlayerControls disabled={view === 'loading'} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  body: { flex: 1 },
});
