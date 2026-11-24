import React, { useCallback, useMemo, useRef } from 'react';
import {
  FlashList,
  type FlashListRef,
  type ListRenderItem,
} from '@shopify/flash-list';
import type { ChapterText } from '../../hooks/useChapterText';
import type { Paragraph } from '../../model/types';
import { TextCard } from '../TextCard';
import { AutoScroll, useScrollSuspension } from './AutoScroll';
import { ParagraphItem, type SentenceActions } from './ParagraphItem';
import { styles } from './PlayerText.styles';

interface PlayerTextProps {
  text: ChapterText;
  actions: SentenceActions;
}

const keyOf = ({ first }: Paragraph) => String(first);

/** A chapter's text that follows the voice. One list for each chapter (`key` by its owner). */
export function PlayerText({ text, actions }: PlayerTextProps) {
  const list = useRef<FlashListRef<Paragraph>>(null);
  const onLoadRef = useRef<() => void>(() => {});
  const { suspended, suspend, resume } = useScrollSuspension();
  const { chapter, chunk, paragraphs } = text;
  const { onRead, onBookmark } = actions;
  const sentenceActions = useMemo<SentenceActions>(
    () => ({
      // A tap is where the user wants to be: the text follows again
      onRead: sentence => {
        resume();
        onRead(sentence);
      },
      onBookmark,
    }),
    [onRead, onBookmark, resume],
  );
  const renderItem = useCallback<ListRenderItem<Paragraph>>(
    ({ item }) => (
      <ParagraphItem
        chapter={chapter}
        paragraph={item}
        sentences={chunk.sentences}
        actions={sentenceActions}
      />
    ),
    [chapter, chunk, sentenceActions],
  );
  const onLoad = useCallback(() => onLoadRef.current(), []);
  return (
    <TextCard faded>
      <FlashList
        ref={list}
        testID="player-text"
        data={paragraphs}
        keyExtractor={keyOf}
        renderItem={renderItem}
        onLoad={onLoad}
        onScrollBeginDrag={suspend}
        style={styles.list}
        contentContainerStyle={styles.content}
        // The list keeps its place by itself: what is above never changes
        maintainVisibleContentPosition={{ disabled: true }}
      />
      <AutoScroll
        list={list}
        text={text}
        onLoadRef={onLoadRef}
        suspended={suspended}
        onResume={resume}
      />
    </TextCard>
  );
}
