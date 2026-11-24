import type { DimensionValue } from 'react-native';
import type { radius } from '@/shared/theme';

export interface SkeletonProps {
  width: DimensionValue;
  height: number;
  /** Radius token; `sm` by default. */
  corner?: keyof typeof radius;
}
