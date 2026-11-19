import { StyleSheet } from 'react-native';
import {
  color,
  size,
  space,
  type ColorToken,
  type TypeVariant,
} from '@/shared/theme';
import type { ListRowTone } from './ListRow.types';

export const styles = StyleSheet.create({
  row: {
    minHeight: size.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.divider,
  },
  text: {
    flex: 1,
    gap: space.xs / 2,
  },
});

export const titleLook: Record<
  ListRowTone,
  { variant: TypeVariant; color: ColorToken }
> = {
  default: { variant: 'body', color: 'text' },
  muted: { variant: 'body', color: 'textRead' },
  active: { variant: 'bodyStrong', color: 'text' },
};
