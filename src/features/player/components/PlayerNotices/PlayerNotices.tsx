import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Snackbar } from '@/shared/ui';
import type { BookmarkNotice } from '../../hooks/usePlayerBookmarks';

/** Long enough to read it. */
export const VOICE_NOTICE_MS = 6000;

interface PlayerNoticesProps {
  bookmark: BookmarkNotice | null;
  voiceReplaced: boolean;
  onVoiceShown: () => void;
}

/** Short messages over the bottom of the text; the bookmark's goes over the voice's. */
export function PlayerNotices({
  bookmark,
  voiceReplaced,
  onVoiceShown,
}: PlayerNoticesProps) {
  const { t } = useTranslation();
  useEffect(() => {
    if (!voiceReplaced) {
      return undefined;
    }
    const timer = setTimeout(onVoiceShown, VOICE_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [voiceReplaced, onVoiceShown]);
  if (bookmark !== null) {
    return <Snackbar message={t(`player.bookmark.${bookmark}`)} />;
  }
  return voiceReplaced ? (
    <Snackbar message={t('player.voiceReplaced')} />
  ) : null;
}
