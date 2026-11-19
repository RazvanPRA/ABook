import type { NavigatorScreenParams } from '@react-navigation/native';
import type { BookId } from '@/shared/domain';

export type TabsParamList = {
  Library: undefined;
  Player: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabsParamList> | undefined;
  Import: undefined;
  Book: { id: BookId };
  /** Visual catalog of the shared/ui primitives; registered only in __DEV__ builds. */
  DevUi: undefined;
  /** Storage inspector (seed, delete, stats); registered only in __DEV__ builds. */
  DevStorage: undefined;
  /** Extractor check (speed, JS-thread gaps, cleaned text); registered only in __DEV__ builds. */
  DevPdf: { file?: string; page?: string } | undefined;
};

// Global typing: useNavigation() / navigation.navigate() are typed everywhere without importing app/.
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
