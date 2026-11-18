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
};

// Global typing: useNavigation() / navigation.navigate() are typed everywhere without importing app/.
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
