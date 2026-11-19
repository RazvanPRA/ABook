import * as theme from '..';

/** Collects the paths of every leaf that is undefined, null or NaN. */
const invalidLeaves = (value: unknown, path: string): string[] => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return [path];
  }
  if (typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) =>
      invalidLeaves(v, `${path}.${k}`),
    );
  }
  return [];
};

describe('theme tokens', () => {
  it.each(['color', 'type', 'space', 'radius', 'size', 'duration', 'opacity'])(
    '%s has no undefined values',
    name => {
      const tokens = theme[name as keyof typeof theme];
      expect(tokens).toBeDefined();
      expect(invalidLeaves(tokens, name)).toEqual([]);
    },
  );

  it('defines the full PROMPT §7 palette', () => {
    expect(Object.keys(theme.color).sort()).toEqual(
      [
        'bg',
        'surface',
        'surfaceRaised',
        'border',
        'divider',
        'tabBar',
        'text',
        'textMuted',
        'textRead',
        'accent',
        'onAccent',
        'success',
        'successBg',
        'danger',
        'dangerBorder',
        'info',
        'cover',
      ].sort(),
    );
    expect(theme.color.cover).toHaveLength(3);
  });

  it('keeps the touch target at 44 pt and headers capped at 1.4×', () => {
    expect(theme.size.touchTarget).toBe(44);
    expect(theme.size.maxFontScaleHeader).toBe(1.4);
  });
});
