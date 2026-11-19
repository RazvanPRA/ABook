import React, { type PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import type { AppStore } from '../store';

/** Makes the store available to feature hooks (`useSelector`, `useDispatch`). */
export function StoreProvider({
  store,
  children,
}: PropsWithChildren<{ store: AppStore }>) {
  return <Provider store={store}>{children}</Provider>;
}
