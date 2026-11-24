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
  /** Floating action button. */
  fab: 56,
  /** Text field and select height (grows with the font scale). */
  input: 52,
  progressBar: 4,
  /** Status circle of an import step. */
  stepIndicator: 28,
  /** "PDF" badge of the picked file card. */
  fileBadge: 44,
  coverSm: { width: 48, height: 64 },
  coverLg: { width: 160, height: 220 },
  emptyStateIcon: 88,
  switch: { width: 48, height: 28, thumb: 22 },
  /** Font scaling cap for headers (PROMPT §8). */
  maxFontScaleHeader: 1.4,
} as const;

export type IconSize = keyof typeof size.icon;
