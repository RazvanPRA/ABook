import React, { type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { color, radius, size, space } from '@/shared/theme';

type TextCardProps = PropsWithChildren<{
  /** What is at the bottom fades out: there is more below. */
  faded?: boolean;
}>;

/** The card between the header and the controls, as high as they leave it. */
export function TextCard({ faded = false, children }: TextCardProps) {
  return (
    <View style={styles.card}>
      {children}
      {faded ? <BottomFade /> : null}
    </View>
  );
}

function BottomFade() {
  return (
    <View pointerEvents="none" style={styles.fade}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color.surface} stopOpacity={0} />
            <Stop offset="1" stopColor={color.surface} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#fade)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginHorizontal: space.screenPadding,
    borderRadius: radius.cardLg,
    backgroundColor: color.surface,
    overflow: 'hidden',
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: size.readerFade,
  },
});
