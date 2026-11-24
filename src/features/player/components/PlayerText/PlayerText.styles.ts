import { StyleSheet, type TextStyle } from 'react-native';
import type { FontScale } from '@/shared/domain';
import { color, size, space, type } from '@/shared/theme';

export type SentenceTone = 'read' | 'active' | 'activePlain' | 'upcoming';

/** How a sentence looks, from its distance to the active one. */
export function toneOf(distance: number, highlight: boolean): SentenceTone {
  if (distance === 0) {
    return highlight ? 'active' : 'activePlain';
  }
  return distance < 0 ? 'read' : 'upcoming';
}

export const spanStyles = StyleSheet.create<Record<SentenceTone, TextStyle>>({
  read: { color: color.textRead },
  active: { color: color.text, backgroundColor: color.highlight },
  activePlain: { color: color.text },
  upcoming: { color: color.textUpcoming },
});

const paragraph = { paddingBottom: space.md };

export const scaleStyles = StyleSheet.create<Record<FontScale, TextStyle>>({
  0: { ...type.readerSm, ...paragraph },
  1: { ...type.readerMd, ...paragraph },
  2: { ...type.readerLg, ...paragraph },
});

export const styles = StyleSheet.create({
  list: { flex: 1 },
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.xl,
    // The last sentence can be scrolled above the fade
    paddingBottom: size.readerFade,
  },
  back: {
    position: 'absolute',
    bottom: space.md,
    alignSelf: 'center',
  },
});
