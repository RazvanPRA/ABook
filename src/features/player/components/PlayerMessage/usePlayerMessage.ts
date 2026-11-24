import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import type { BookId } from '@/shared/domain';
import type { EmptyStateProps } from '@/shared/ui';
import type { PlayerActions } from '../../hooks/usePlaybackSession';
import type { PlayerView } from '../../services/playerView';
import { selectPlayerBook } from '../../state/selectors';

export type MessageView = Exclude<PlayerView, 'empty' | 'loading' | 'text'>;

export interface PlayerMessage {
  readonly main: EmptyStateProps;
  /** A second way out, under the first. */
  readonly other?: { label: string; onPress: () => void };
}

interface MessageActions {
  readonly session: PlayerActions;
  readonly onOpenBook: (id: BookId) => void;
}

/** What happened to the playback and what can be done about it. */
export function usePlayerMessage(
  view: MessageView,
  { session, onOpenBook }: MessageActions,
): PlayerMessage {
  const { t } = useTranslation();
  const book = useSelector(selectPlayerBook);
  const retry = { label: t('player.error.retry'), onPress: session.retry };
  switch (view) {
    case 'waiting':
      return {
        main: {
          icon: 'download',
          title: t('player.waiting.title'),
          description: t('player.waiting.detail'),
        },
      };
    case 'ended':
      return {
        main: {
          icon: 'check',
          title: t('player.ended.title'),
          description: t('player.ended.detail'),
          action: { label: t('player.ended.action'), onPress: session.play },
        },
      };
    case 'incomplete':
      return {
        main: {
          icon: 'download',
          title: t('player.incomplete.title'),
          description: t('player.incomplete.detail'),
          action: {
            label: t('player.incomplete.action'),
            onPress: () => book && onOpenBook(book.id),
          },
        },
      };
    case 'speech':
      return {
        main: {
          icon: 'headphones',
          title: t('player.error.speech.title'),
          description: t('player.error.speech.detail'),
          action: retry,
        },
      };
    case 'voice':
      return {
        main: {
          icon: 'headphones',
          title: t('player.error.voice.title'),
          description: t('player.error.voice.detail'),
          action: retry,
        },
        ...(Platform.OS === 'android' && {
          other: {
            label: t('player.error.voice.action'),
            onPress: session.openVoiceSettings,
          },
        }),
      };
    case 'missingText':
      return {
        main: {
          icon: 'book',
          title: t('player.error.text.title'),
          description: t('player.error.text.detail'),
          action: retry,
        },
        other: {
          label: t('player.error.text.action'),
          onPress: session.skipChapter,
        },
      };
  }
}
