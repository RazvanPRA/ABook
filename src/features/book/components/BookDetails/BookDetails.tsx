import React, { useCallback } from 'react';
import type { BookId } from '@/shared/domain';
import { useBookDetails } from '../../hooks/useBookDetails';
import { useBookOverlay } from '../../hooks/useBookOverlay';
import { useDeleteBook } from '../../hooks/useDeleteBook';
import { usePlayBook } from '../../hooks/usePlayBook';
import { BookContentView } from '../BookContentView';
import { BookHeader } from '../BookHeader';
import { BookOverlays } from '../BookOverlays';
import { BookSkeleton } from '../BookSkeleton';
import { DeleteFailed } from '../DeleteFailed';
import { MissingBook } from '../MissingBook';

interface BookDetailsProps {
  bookId: BookId;
  onBack: () => void;
  onLibrary: () => void;
  onPlay: () => void;
}

/** A book by its id, in whichever state it is. */
export function BookDetails({
  bookId,
  onBack,
  onLibrary,
  onPlay,
}: BookDetailsProps) {
  const view = useBookDetails(bookId);
  const overlay = useBookOverlay();
  const { show } = overlay;
  const remove = useDeleteBook(bookId, onLibrary);
  const { play, restart } = usePlayBook(bookId, onPlay);
  const askMenu = useCallback(() => show('menu'), [show]);
  const askDelete = useCallback(() => show('delete'), [show]);
  const askRestart = useCallback(() => show('restart'), [show]);

  switch (view.type) {
    case 'missing':
      return <MissingBook onLibrary={onLibrary} />;
    case 'loading':
      return (
        <>
          <BookHeader onBack={onBack} />
          <BookSkeleton />
        </>
      );
    case 'delete-failed':
      return (
        <>
          <BookHeader onBack={onBack} />
          <DeleteFailed onRetry={remove} />
        </>
      );
    case 'loaded':
      return (
        <>
          <BookHeader onBack={onBack} onMore={askMenu} />
          <BookContentView
            loaded={view.loaded}
            onPlay={play}
            onRestart={askRestart}
            onDelete={askDelete}
          />
          <BookOverlays
            book={view.loaded.book}
            overlay={overlay}
            onDelete={remove}
            onRestart={restart}
          />
        </>
      );
  }
}
