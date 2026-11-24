import React, { memo, useCallback } from 'react';
import { Text, type AccessibilityActionEvent } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectSettings } from '@/features/settings';
import { useActiveSentence } from '../../hooks/useActiveSentence';
import type { Paragraph } from '../../model/types';
import { scaleStyles, toneOf } from './PlayerText.styles';
import { SentenceSpan } from './SentenceSpan';

export interface SentenceActions {
  readonly onRead: (sentence: number) => void;
  readonly onBookmark: (sentence: number) => void;
}

interface ParagraphItemProps {
  chapter: number;
  paragraph: Paragraph;
  sentences: readonly string[];
  actions: SentenceActions;
}

/**
 * One paragraph. For a screen reader it is a single text, with the actions of its active sentence,
 * or of its first one; nothing is announced while the voice reads.
 */
export const ParagraphItem = memo(function ParagraphItemView({
  chapter,
  paragraph,
  sentences,
  actions: { onRead, onBookmark },
}: ParagraphItemProps) {
  const { t } = useTranslation();
  const { first, end } = paragraph;
  const active = useActiveSentence(chapter, paragraph);
  const { highlightSentence, fontScale } = useSelector(selectSettings);
  const target = active >= 0 && active < end - first ? first + active : first;
  const onAction = useCallback(
    ({ nativeEvent: { actionName } }: AccessibilityActionEvent) =>
      actionName === 'bookmark' ? onBookmark(target) : onRead(target),
    [onBookmark, onRead, target],
  );
  return (
    <Text
      style={scaleStyles[fontScale]}
      accessible
      testID="paragraph"
      accessibilityActions={[
        { name: 'read', label: t('player.text.read') },
        { name: 'bookmark', label: t('player.text.bookmark') },
      ]}
      onAccessibilityAction={onAction}
    >
      {sentences.slice(first, end).map((sentence, i) => (
        <React.Fragment key={first + i}>
          {i > 0 ? ' ' : null}
          <SentenceSpan
            text={sentence}
            index={first + i}
            tone={toneOf(i - active, highlightSentence)}
            onPress={onRead}
            onLongPress={onBookmark}
          />
        </React.Fragment>
      ))}
    </Text>
  );
});
