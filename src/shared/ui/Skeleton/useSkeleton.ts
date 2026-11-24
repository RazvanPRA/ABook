import { useEffect, useMemo } from 'react';
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { color, duration, opacity, radius } from '@/shared/theme';
import type { SkeletonProps } from './Skeleton.types';

/** The block's box and its pulse, which stays still when the system asks for reduced motion. */
export function useSkeleton({ width, height, corner = 'sm' }: SkeletonProps) {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = reduced
      ? 1
      : withRepeat(
          withTiming(opacity.skeleton, { duration: duration.skeleton }),
          -1,
          true,
        );
  }, [pulse, reduced]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));
  const box = useMemo(
    () => ({
      width,
      height,
      borderRadius: radius[corner],
      backgroundColor: color.surface,
    }),
    [width, height, corner],
  );
  return { box, pulseStyle };
}
