import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { App } from '../App';

test('renders the app root', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App />);
  });
  // Host and composite View both carry the testID; @testing-library/react-native replaces this in step 4.
  expect(tree?.root.findAllByProps({ testID: 'app-root' }).length).toBeGreaterThan(0);
});
