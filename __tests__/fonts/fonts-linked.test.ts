/// <reference types="node" />
/**
 * @jest-environment node
 *
 * Every family in fontFamily must be bundled and linked on both platforms
 * (run `npx react-native-asset` after adding a font to assets/fonts).
 */
import fs from 'fs';
import path from 'path';
import { fontFamily } from '@/shared/theme';

const ROOT = path.resolve(__dirname, '..', '..');
const families = Object.values(fontFamily);
const plist = fs.readFileSync(path.join(ROOT, 'ios/ABook/Info.plist'), 'utf8');

describe.each(families)('font %s', family => {
  it('is in assets/fonts', () => {
    expect(
      fs.existsSync(path.join(ROOT, 'assets/fonts', `${family}.ttf`)),
    ).toBe(true);
  });

  it('is linked on Android', () => {
    const file = path.join(
      ROOT,
      'android/app/src/main/assets/fonts',
      `${family}.ttf`,
    );
    expect(fs.existsSync(file)).toBe(true);
  });

  it('is listed in UIAppFonts on iOS', () => {
    expect(plist).toContain(`<string>${family}.ttf</string>`);
  });
});
