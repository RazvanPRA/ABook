import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Linking, type EmitterSubscription } from 'react-native';
import type { LinkingOptions } from '@react-navigation/native';
import { linking } from './linking';
import type { RootStackParamList } from './types';

/**
 * The navigator mounts only after the bootstrap, and until then nobody listens for links. This
 * keeps the last one that arrives meanwhile and hands it over as the initial URL, instead of the
 * one the app was started with. `release` stops listening, once the navigator does.
 */
export function usePendingLink() {
  const pending = useRef<string | null>(null);
  const subscription = useRef<EmitterSubscription | null>(null);

  const release = useCallback(() => {
    subscription.current?.remove();
    subscription.current = null;
  }, []);

  useEffect(() => {
    subscription.current = Linking.addEventListener('url', ({ url }) => {
      pending.current = url;
    });
    return release;
  }, [release]);

  const withPending = useMemo<LinkingOptions<RootStackParamList>>(
    () => ({
      ...linking,
      // Read after the wait: a link may still arrive during it
      getInitialURL: async () => {
        const started = await Linking.getInitialURL();
        return pending.current ?? started;
      },
    }),
    [],
  );
  return { linking: withPending, release };
}
