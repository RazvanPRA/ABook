import React from 'react';
import Animated from 'react-native-reanimated';
import type { SkeletonProps } from './Skeleton.types';
import { useSkeleton } from './useSkeleton';

/** A placeholder for content being loaded; the screen announces the loading, not its blocks. */
export function Skeleton(props: SkeletonProps) {
  const { box, pulseStyle } = useSkeleton(props);
  return (
    <Animated.View
      testID="skeleton"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[box, pulseStyle]}
    />
  );
}
