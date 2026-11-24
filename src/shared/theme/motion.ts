/** Animation timings and opacities. */
export const duration = {
  /** Sentence highlight and switch transitions. */
  highlight: 150,
  /** Half of a skeleton's pulse. */
  skeleton: 800,
} as const;

export const opacity = {
  /** Background of the highlighted sentence. */
  highlight: 0.18,
  disabled: 0.4,
  pressed: 0.7,
  /** Dim end of a skeleton's pulse. */
  skeleton: 0.5,
  /** Backdrop behind a sheet (`color.bg` at this opacity). */
  scrim: 0.85,
} as const;
