/** Fixed component sizes (PROMPT §7, §8). */
export const size = {
  /** Minimum touch target (PROMPT §8). */
  touchTarget: 44,
  /** Play / pause button of the player. */
  playButton: 76,
  icon: { sm: 16, md: 20, lg: 24, xl: 32 },
  /** Bottom tab bar height, without the bottom safe area. */
  tabBarHeight: 64,
  /** Large button (pill CTAs). */
  buttonLg: 52,
  /** Text field and select height (grows with the font scale). */
  input: 52,
  progressBar: 4,
  coverSm: { width: 48, height: 64 },
  coverLg: { width: 160, height: 220 },
  emptyStateIcon: 88,
  switch: { width: 48, height: 28, thumb: 22 },
  /** Font scaling cap for headers (PROMPT §8). */
  maxFontScaleHeader: 1.4,
} as const;

export type IconSize = keyof typeof size.icon;
