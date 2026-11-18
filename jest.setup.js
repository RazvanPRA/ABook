/* eslint-env jest */
// Official mocks of native modules. Extended in M0 step 4.
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);
