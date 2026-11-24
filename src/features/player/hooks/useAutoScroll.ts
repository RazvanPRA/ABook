import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type { FlashListRef } from '@shopify/flash-list';
import { useSelector } from 'react-redux';
import { logger } from '@/shared/utils';
import type { Paragraph } from '../model/types';
import { paragraphOf } from '../services/paragraphs';
import {
  isInTopThird,
  sentenceTop,
  TOP_MARGIN,
} from '../services/scrollTarget';
import { selectSession } from '../state/selectors';
import type { ChapterText } from './useChapterText';

/** Farther than this many screens, the list jumps instead of scrolling. */
const JUMP_SCREENS = 2;

type List = FlashListRef<Paragraph>;

/** Where the sentence is in the list; `null` while its paragraph isn't laid out. */
function topOf(list: List, text: ChapterText, sentence: number): number | null {
  const index = paragraphOf(text.paragraphs, sentence);
  const paragraph = text.paragraphs[index];
  const layout = list.getLayout(index);
  return paragraph && layout
    ? sentenceTop(text.chunk.sentences, { paragraph, sentence, layout })
    : null;
}

async function bringToTop(list: List, text: ChapterText, sentence: number) {
  const { height } = list.getWindowSize();
  const offset = list.getAbsoluteLastScrollOffset();
  const top = topOf(list, text, sentence);
  if (top !== null && isInTopThird(top - offset, height)) {
    return;
  }
  const far = top === null || Math.abs(top - offset) > height * JUMP_SCREENS;
  if (far) {
    const index = paragraphOf(text.paragraphs, sentence);
    await list.scrollToIndex({ index, animated: false });
  }
  // After a jump the paragraphs around are measured, so their place is exact
  const exact = topOf(list, text, sentence);
  if (exact !== null) {
    const target = Math.max(0, exact - height * TOP_MARGIN);
    list.scrollToOffset({ offset: target, animated: !far });
  }
}

/** Keeps the active sentence in the top third of the list, unless the user scrolled away. */
export function useAutoScroll(
  list: RefObject<List | null>,
  text: ChapterText,
  suspended: boolean,
) {
  const sentence = useSelector(selectSession).position?.sentence ?? 0;
  const scroll = useCallback(() => {
    if (list.current && paragraphOf(text.paragraphs, sentence) >= 0) {
      bringToTop(list.current, text, sentence).catch(error =>
        logger.warn('player: scrolling failed', error),
      );
    }
  }, [list, text, sentence]);

  const ready = useRef(false);
  useEffect(() => {
    if (!suspended && ready.current) {
      scroll();
    }
  }, [scroll, suspended]);

  /** The list drew its first items: from now on it can scroll. */
  const onLoad = useCallback(() => {
    ready.current = true;
    scroll();
  }, [scroll]);
  return onLoad;
}
