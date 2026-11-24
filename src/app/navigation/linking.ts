import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const URL_SCHEME = 'abook';

/** abook://dev/ui (primitives catalog), abook://dev/storage (storage inspector), abook://dev/pdf (extractor check), abook://dev/tts (voice check): __DEV__ builds only. */
const devScreens = __DEV__
  ? {
      DevUi: 'dev/ui',
      DevStorage: 'dev/storage',
      DevPdf: 'dev/pdf',
      DevTts: 'dev/tts',
    }
  : {};

/** Deep links: abook://library, abook://player, abook://settings, abook://import, abook://book/<id> */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [`${URL_SCHEME}://`],
  config: {
    // A link to a root screen opens it over the tabs, so back leads to the Library
    initialRouteName: 'Tabs',
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
