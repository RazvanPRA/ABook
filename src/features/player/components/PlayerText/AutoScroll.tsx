import React, { useCallback, useState, type RefObject } from 'react';
import { View } from 'react-native';
import type { FlashListRef } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import type { ChapterText } from '../../hooks/useChapterText';
import type { Paragraph } from '../../model/types';
import { styles } from './PlayerText.styles';

interface AutoScrollProps {
  list: RefObject<FlashListRef<Paragraph> | null>;
  text: ChapterText;
  /** Set to what the list calls once it can scroll. */
  onLoadRef: RefObject<() => void>;
  /** The user scrolled away. */
  suspended: boolean;
  onResume: () => void;
}

/**
 * Follows the active sentence; after a scroll by hand, offers the way back. Apart from the list, so
 * that a new sentence doesn't render it.
 */
export function AutoScroll({
  list,
  text,
  onLoadRef,
  suspended,
  onResume,
}: AutoScrollProps) {
  const { t } = useTranslation();
  onLoadRef.current = useAutoScroll(list, text, suspended);
  return suspended ? (
    <View style={styles.back}>
      <Button
        variant="secondary"
        label={t('player.text.back')}
        onPress={onResume}
      />
    </View>
  ) : null;
}

/** Whether the list follows the sentence; a drag stops it, the list's own scrolls don't. */
export function useScrollSuspension() {
  const [suspended, setSuspended] = useState(false);
  const suspend = useCallback(() => setSuspended(true), []);
  const resume = useCallback(() => setSuspended(false), []);
  return { suspended, suspend, resume };
}
