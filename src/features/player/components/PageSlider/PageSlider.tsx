import React, { memo, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { space } from '@/shared/theme';
import { AppText, SliderTrack } from '@/shared/ui';
import { usePageRange } from '../../hooks/usePageRange';
import { usePlayerDispatch } from '../../hooks/usePlayerDispatch';
import { useRemainingTime } from '../../hooks/useRemainingTime';
import { seekPage } from '../../state/thunks';

/** Where in the book it is. While dragging only the label moves; the release goes there. */
export const PageSlider = memo(function PageSliderView({
  disabled,
}: {
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const dispatch = usePlayerDispatch();
  const { page, total } = usePageRange();
  const remaining = useRemainingTime();
  const [dragged, setDragged] = useState<number | null>(null);
  const go = useCallback(
    (target: number) => {
      setDragged(null);
      dispatch(seekPage(target));
    },
    [dispatch],
  );
  const current = t('player.page.current', { page: dragged ?? page });
  return (
    <View style={styles.root}>
      <SliderTrack
        accessibilityLabel={t('player.page.label')}
        valueText={current}
        value={page}
        range={{ min: 1, max: Math.max(total, 1), step: 1 }}
        onChange={setDragged}
        onComplete={go}
        disabled={disabled}
      />
      <View style={styles.labels}>
        <AppText variant="caption" color="textMuted" style={styles.side}>
          {current}
        </AppText>
        <AppText variant="caption" color="textMuted" align="center">
          {remaining}
        </AppText>
        <AppText
          variant="caption"
          color="textMuted"
          align="right"
          style={styles.side}
        >
          {total}
        </AppText>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { paddingHorizontal: space.screenPadding },
  labels: { flexDirection: 'row', gap: space.sm },
  side: { flex: 1 },
});
