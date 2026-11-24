/// <reference types="node" />
/**
 * @jest-environment node
 *
 * Guards the native settings of M0 step 7 (PROMPT §1: offline only; §2: background audio on iOS).
 * The merged manifests were checked with Gradle (processReleaseMainManifest): release has no network
 * or shared-storage permission. These tests keep the source manifests from drifting.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..', '..');
const read = (file: string) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const removes = (xml: string, permission: string) =>
  new RegExp(
    `<uses-permission[^>]*android\\.permission\\.${permission}"[^>]*tools:node="remove"`,
  ).test(xml);

it('MainActivity keeps a link that arrives while JS is loading', () => {
  const activity = read('android/app/src/main/java/com/abook/MainActivity.kt');
  expect(activity).toMatch(/onNewIntent[^}]*setIntent\(intent\)/);
});

describe('Android manifests', () => {
  const main = read('android/app/src/main/AndroidManifest.xml');
  const release = read('android/app/src/release/AndroidManifest.xml');
  const debug = read('android/app/src/debug/AndroidManifest.xml');

  it('main does not request INTERNET', () => {
    expect(main).not.toMatch(
      /android\.permission\.INTERNET"(?![^>]*tools:node="remove")/,
    );
  });

  it.each(['INTERNET', 'ACCESS_NETWORK_STATE', 'ACCESS_LOCAL_NETWORK'])(
    'release removes %s merged from libraries',
    permission => {
      expect(removes(release, permission)).toBe(true);
    },
  );

  it.each(['READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE'])(
    'main removes %s (files come through the document picker)',
    permission => {
      expect(removes(main, permission)).toBe(true);
    },
  );

  it('main sees the speech engines (Android 11+ hides them otherwise)', () => {
    expect(main).toMatch(
      /<queries>[\s\S]*android\.intent\.action\.TTS_SERVICE[\s\S]*<\/queries>/,
    );
  });

  it.each([
    'FOREGROUND_SERVICE',
    'FOREGROUND_SERVICE_MEDIA_PLAYBACK',
    'POST_NOTIFICATIONS',
    'WAKE_LOCK',
  ])('main requests %s for the playback service', permission => {
    expect(main).toContain(`android.permission.${permission}"`);
  });

  it('declares the playback service, private and told when the app is swiped away', () => {
    const service = main.match(/<service[^>]*PlaybackService"[^>]*>/)?.[0];
    expect(service).toContain('android:exported="false"');
    expect(service).toContain('android:foregroundServiceType="mediaPlayback"');
    expect(service).toContain('android:stopWithTask="false"');
  });

  it('debug keeps INTERNET for Metro', () => {
    expect(debug).toContain('android.permission.INTERNET');
  });
});

it('the Xcode project compiles the iOS voice module', () => {
  const project = read('ios/ABook.xcodeproj/project.pbxproj');
  expect(project).toContain('AbookTts.mm in Sources */,');
  expect(read('ios/ABook/Tts/AbookTts.mm')).toContain(
    'RCT_EXPORT_MODULE(AbookTts)',
  );
});

describe('iOS Info.plist', () => {
  const plist = read('ios/ABook/Info.plist');

  it('enables background audio', () => {
    expect(plist).toMatch(
      /<key>UIBackgroundModes<\/key>\s*<array>\s*<string>audio<\/string>/,
    );
  });
});
