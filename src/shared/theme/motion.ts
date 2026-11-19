/** Animation timings and opacities. */
export const duration = {
  /** Sentence highlight and switch transitions. */
  highlight: 150,
} as const;

export const opacity = {
  /** Background of the highlighted sentence. */
  highlight: 0.18,
  disabled: 0.4,
  pressed: 0.7,
} as const;
