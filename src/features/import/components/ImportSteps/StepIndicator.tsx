import React from 'react';
import { View } from 'react-native';
import { Icon } from '@/shared/ui';
import type { StepStatus } from '../../model/types';
import { styles } from './ImportSteps.styles';

/** The circle before a step: a check when done, an amber dot while active, a cross on error. */
export function StepIndicator({ status }: { status: StepStatus }) {
  switch (status) {
    case 'done':
      return (
        <View style={styles.done}>
          <Icon name="check" size="sm" color="success" />
        </View>
      );
    case 'active':
      return (
        <View style={styles.active}>
          <View style={styles.activeDot} />
        </View>
      );
    case 'error':
      return (
        <View style={styles.error}>
          <Icon name="x" size="sm" color="danger" />
        </View>
      );
    case 'waiting':
      return <View style={styles.waiting} />;
  }
}
