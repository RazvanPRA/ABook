import React, { useCallback, useMemo } from 'react';
import { BackHandler } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { PlayerScreen, type PlayerScreenProps } from '@/features/player';
import type { TabsParamList } from './types';

type PlayerTabProps = BottomTabScreenProps<TabsParamList, 'Player'>;

/** The tab the player was opened from; the Library after a cold link to it. */
function previousTab(
  state: ReturnType<PlayerTabProps['navigation']['getState']>,
): Exclude<keyof TabsParamList, 'Player'> {
  const visited = state.history.flatMap(entry =>
    entry.type === 'route'
      ? state.routes.filter(({ key }) => key === entry.key)
      : [],
  );
  const last = visited
    .map(({ name }) => name)
    .filter(name => name !== 'Player');
  return last[last.length - 1] === 'Settings' ? 'Settings' : 'Library';
}

/** The chevron and Android's back leave the player for the tab it was opened from. */
export function PlayerRoute({ navigation }: PlayerTabProps) {
  const root = useNavigation();
  const actions = useMemo<PlayerScreenProps>(
    () => ({
      onClose: () => navigation.navigate(previousTab(navigation.getState())),
      onLibrary: () => navigation.navigate('Library'),
      onOpenBook: id => root.navigate('Book', { id }),
    }),
    [navigation, root],
  );
  const { onClose } = actions;
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          onClose();
          return true;
        },
      );
      return () => subscription.remove();
    }, [onClose]),
  );
  return <PlayerScreen {...actions} />;
}
