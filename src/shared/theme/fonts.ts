/**
 * Font families bundled in assets/fonts (linked with react-native-asset).
 * The values are the PostScript names, which are also the file names, so they work on Android and iOS.
 * Space Grotesk has no static SemiBold: titles specified as 600 use Medium (500) or Bold (700).
 */
export const fontFamily = {
  body: 'Inter-Regular',
  bodySemiBold: 'Inter-SemiBold',
  titleMedium: 'SpaceGrotesk-Medium',
  titleBold: 'SpaceGrotesk-Bold',
} as const;

export type FontFamily = (typeof fontFamily)[keyof typeof fontFamily];
