import { PermissionsAndroid, Platform } from 'react-native';
import { logger } from '@/shared/utils';
import NativeAbookTts, { type Spec } from '../../../specs/NativeAbookTts';
import {
  PLAYBACK_COMMANDS,
  type PlaybackCommand,
  type PlaybackNotifier,
} from './playbackNotifier';

const NOTIFICATIONS_ASKED_SINCE = 33;

/** Android 13+ asks; playback works the same when refused, only without the notification. */
async function askForNotifications(): Promise<void> {
  if (
    Platform.OS !== 'android' ||
    Number(Platform.Version) < NOTIFICATIONS_ASKED_SINCE
  ) {
    return;
  }
  const { POST_NOTIFICATIONS } = PermissionsAndroid.PERMISSIONS;
  if (!(await PermissionsAndroid.check(POST_NOTIFICATIONS))) {
    await PermissionsAndroid.request(POST_NOTIFICATIONS);
  }
}

const toCommand = (type: string): PlaybackCommand | undefined =>
  PLAYBACK_COMMANDS.find(known => known === type);

/** `PlaybackNotifier` over the Android foreground service; iOS has nothing to show. */
export function createNativePlaybackNotifier(
  native: Pick<
    Spec,
    'showPlayback' | 'hidePlayback' | 'onPlaybackCommand'
  > = NativeAbookTts,
  ask: () => Promise<void> = askForNotifications,
): PlaybackNotifier {
  let asked = false;
  return {
    show(info) {
      native.showPlayback({ ...info });
      if (!asked) {
        asked = true;
        ask()
          // What was shown before the answer stayed hidden
          .then(() => native.showPlayback({ ...info }))
          .catch(error =>
            logger.warn('tts: no notification permission', error),
          );
      }
    },
    hide: () => native.hidePlayback(),
    onCommand(listener) {
      const subscription = native.onPlaybackCommand(({ type }) => {
        const command = toCommand(type);
        if (command) {
          listener(command);
        }
      });
      return () => subscription.remove();
    },
  };
}
