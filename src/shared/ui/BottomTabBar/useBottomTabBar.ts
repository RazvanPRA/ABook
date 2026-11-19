import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Bottom padding that clears the gesture bar / home indicator. */
export function useBottomTabBar() {
  const { bottom } = useSafeAreaInsets();
  return useMemo(() => ({ paddingBottom: bottom }), [bottom]);
}
