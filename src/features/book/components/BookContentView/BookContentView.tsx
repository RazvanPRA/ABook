import React, { useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Bookmark, ChapterIndex } from '@/shared/domain';
import { Button, Snackbar } from '@/shared/ui';
import type { LoadedBook } from '../../hooks/useBookDetails';
import { useBookmarkRemoval } from '../../hooks/useBookmarkRemoval';
import type { PlaybackStart } from '../../hooks/usePlayBook';
import { BookHero } from '../BookHero';
import { BookmarkList } from '../BookmarkList';
import { ChapterList } from '../ChapterList';
import { FailedBanner } from '../FailedBanner';
import { ImportBanner } from '../ImportBanner';
import { ListenProgress } from '../ListenProgress';
import { PrimaryPlayButton } from '../PrimaryPlayButton';
import { styles } from './BookContentView.styles';

interface BookContentViewProps {
  loaded: LoadedBook;
  onPlay: (from?: PlaybackStart) => void;
  onRestart: () => void;
  onDelete: () => void;
}

/** The whole of a book that could be read (mockup 03), with its import's banner if any. */
export function BookContentView({
  loaded,
  onPlay,
  onRestart,
  onDelete,
}: BookContentViewProps) {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();
  const { book, progress, content } = loaded;
  const { toc } = content;
  const marks = useBookmarkRemoval(book.id, content.bookmarks);
  const play = useCallback(() => onPlay(), [onPlay]);
  const playChapter = useCallback(
    (chapter: ChapterIndex) => onPlay({ chapter }),
    [onPlay],
  );
  const openBookmark = useCallback(
    ({ chapter, sentence }: Bookmark) => onPlay({ chapter, sentence }),
    [onPlay],
  );
  return (
    <View style={[styles.root, { paddingBottom: bottom }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <BookHero book={book} />
        {book.status === 'processing' ? (
          <ImportBanner book={book} savedChapters={toc.length} />
        ) : null}
        {book.status === 'failed' ? (
          <FailedBanner book={book} content={content} />
        ) : null}
        <View style={styles.listen}>
          <PrimaryPlayButton
            progress={progress}
            playable={toc.length > 0}
            onPlay={play}
            onRestart={onRestart}
          />
          {progress ? <ListenProgress book={book} progress={progress} /> : null}
        </View>
        <ChapterList toc={toc} progress={progress} onPlay={playChapter} />
        <BookmarkList
          bookmarks={marks.visible}
          onOpen={openBookmark}
          onRemove={marks.remove}
        />
        <Button
          variant="danger"
          icon="trash"
          label={t('book.delete.action')}
          onPress={onDelete}
        />
      </ScrollView>
      {marks.pending ? (
        <Snackbar
          message={t('book.bookmarks.removed')}
          action={{ label: t('book.bookmarks.undo'), onPress: marks.undo }}
        />
      ) : null}
    </View>
  );
}
