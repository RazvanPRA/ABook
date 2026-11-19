import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space } from '@/shared/theme';

/** Top padding that clears the status bar / notch. */
export function useScreenHeader() {
  const { top } = useSafeAreaInsets();
  return useMemo(() => ({ paddingTop: top + space.lg }), [top]);
}
