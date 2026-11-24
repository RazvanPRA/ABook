import React, { useMemo } from 'react';
import type { BookId } from '@/shared/domain';
import { useChapterText } from '../../hooks/useChapterText';
import type { PlayerActions } from '../../hooks/usePlaybackSession';
import type { PlayerView } from '../../services/playerView';
import {
  PlayerMessage,
  usePlayerMessage,
  type MessageView,
} from '../PlayerMessage';
import { PlayerSkeleton } from '../PlayerSkeleton';
import { PlayerText } from '../PlayerText';

interface PlayerBodyProps {
  view: Exclude<PlayerView, 'empty'>;
  bookId: BookId | null;
  actions: PlayerActions;
  onBookmark: (sentence: number) => void;
  onOpenBook: (id: BookId) => void;
}

/** The card between the header and the controls, in whichever state the playback is. */
export function PlayerBody({ view, onOpenBook, ...rest }: PlayerBodyProps) {
  switch (view) {
    case 'loading':
      return <PlayerSkeleton />;
    case 'text':
      return <ChapterBody {...rest} />;
    default:
      return (
        <MessageBody
          view={view}
          actions={rest.actions}
          onOpenBook={onOpenBook}
        />
      );
  }
}

function ChapterBody({
  bookId,
  actions,
  onBookmark,
}: Pick<PlayerBodyProps, 'bookId' | 'actions' | 'onBookmark'>) {
  const text = useChapterText();
  const chapter = text?.chapter ?? -1;
  const sentenceActions = useMemo(
    () => ({
      onRead: (sentence: number) => actions.read(chapter, sentence),
      onBookmark,
    }),
    [actions, chapter, onBookmark],
  );
  return text === null ? (
    <PlayerSkeleton />
  ) : (
    <PlayerText
      key={`${bookId}-${chapter}`}
      text={text}
      actions={sentenceActions}
    />
  );
}

function MessageBody({
  view,
  actions,
  onOpenBook,
}: Pick<PlayerBodyProps, 'actions' | 'onOpenBook'> & { view: MessageView }) {
  const message = usePlayerMessage(view, { session: actions, onOpenBook });
  return <PlayerMessage message={message} />;
}
