import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const URL_SCHEME = 'abook';

/** abook://dev/ui opens the primitives catalog; the route exists only in __DEV__ builds. */
const devScreens = __DEV__ ? { DevUi: 'dev/ui' } : {};

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
      ...devScreens,
    },
  },
};
