import React, { memo, useCallback } from 'react';
import { Text } from 'react-native';
import { spanStyles, type SentenceTone } from './PlayerText.styles';

interface SentenceSpanProps {
  text: string;
  /** In its chapter. */
  index: number;
  tone: SentenceTone;
  onPress: (index: number) => void;
  onLongPress: (index: number) => void;
}

/** A sentence inside its paragraph's text: tap reads from it, long press bookmarks it. */
export const SentenceSpan = memo(function SentenceSpanView({
  text,
  index,
  tone,
  onPress,
  onLongPress,
}: SentenceSpanProps) {
  const press = useCallback(() => onPress(index), [onPress, index]);
  const longPress = useCallback(() => onLongPress(index), [onLongPress, index]);
  return (
    <Text
      onPress={press}
      onLongPress={longPress}
      suppressHighlighting
      style={spanStyles[tone]}
      testID={`sentence-${index}`}
    >
      {text}
    </Text>
  );
});
