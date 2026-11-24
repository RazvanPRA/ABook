import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Progress } from '@/shared/domain';
import { Button } from '@/shared/ui';

interface PrimaryPlayButtonProps {
  progress: Progress | null;
  /** At least one chapter is saved. */
  playable: boolean;
  onPlay: () => void;
  /** A finished book starts over, after a confirmation. */
  onRestart: () => void;
}

/** "Începe să asculți", "Continuă de la pagina N" or "Ascultă din nou". */
export function PrimaryPlayButton({
  progress,
  playable,
  onPlay,
  onRestart,
}: PrimaryPlayButtonProps) {
  const { t } = useTranslation();
  const finished = progress?.finished === true;
  const resumeLabel =
    progress === null
      ? t('book.play.start')
      : t('book.play.continue', { page: progress.page });
  return (
    <Button
      size="lg"
      icon="play"
      label={finished ? t('book.play.again') : resumeLabel}
      onPress={finished ? onRestart : onPlay}
      disabled={!playable}
    />
  );
}
