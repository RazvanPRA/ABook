import { fontFamily } from './fonts';

/**
 * Type scale (PROMPT §7). Space Grotesk has no static SemiBold, so titles specified as 600 use Bold.
 * `overline` letter spacing is 0.08em of its 12 pt size.
 */
export const type = {
  /** Screen title. */
  display: {
    fontFamily: fontFamily.titleBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 0,
  },
  /** Book title, header. */
  title: {
    fontFamily: fontFamily.titleBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
  },
  /** Text, list rows. */
  body: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
  },
  /** Emphasised body: row titles, buttons. */
  bodyStrong: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
  },
  /** The player's text, in its three sizes (`Settings.fontScale`). */
  readerSm: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0,
  },
  readerMd: {
    fontFamily: fontFamily.body,
    fontSize: 19,
    lineHeight: 31,
    letterSpacing: 0,
  },
  readerLg: {
    fontFamily: fontFamily.body,
    fontSize: 23,
    lineHeight: 37,
    letterSpacing: 0,
  },
  /** Metadata. */
  caption: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  /** Section titles, in capitals. */
  overline: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.96,
    textTransform: 'uppercase',
  },
} as const;

export type TypeVariant = keyof typeof type;
