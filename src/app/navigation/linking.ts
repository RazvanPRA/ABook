import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const URL_SCHEME = 'abook';

/** Deep links: abook://library, abook://player, abook://settings, abook://import, abook://book/<id> */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [`${URL_SCHEME}://`],
  config: {
    screens: {
      Tabs: {
        screens: { Library: 'library', Player: 'player', Settings: 'settings' },
      },
      Import: 'import',
      Book: 'book/:id',
    },
  },
};
