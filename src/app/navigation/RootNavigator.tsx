import React from 'react';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { BookScreen } from '@/features/book';
import { ImportScreen } from '@/features/import';
import { PdfDebugScreen } from '../dev/pdf/PdfDebugScreen';
import { StorageDebugScreen } from '../dev/storage/StorageDebugScreen';
import { UiCatalogScreen } from '../dev/UiCatalogScreen';
import { TabsNavigator } from './TabsNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Adapts the route param to the feature screen's own props (features do not import navigation types). */
function BookRoute({
  route,
}: NativeStackScreenProps<RootStackParamList, 'Book'>) {
  return <BookScreen bookId={route.params.id} />;
}

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabsNavigator} />
      <Stack.Screen
        name="Import"
        component={ImportScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="Book" component={BookRoute} />
      {__DEV__ ? (
        <>
          <Stack.Screen name="DevUi" component={UiCatalogScreen} />
          <Stack.Screen name="DevStorage" component={StorageDebugScreen} />
          <Stack.Screen name="DevPdf" component={PdfDebugScreen} />
        </>
      ) : null}
    </Stack.Navigator>
  );
}
