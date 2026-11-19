// Official mocks of native modules, so component tests run without a device.
require('react-native-gesture-handler/jestSetup');

// Reanimated 4.7's official mock is unusable: it imports src/index, where initializers.native.ts calls
// setCSSEventHandler on JSReanimated (chosen when IS_JEST), which throws. Minimal manual mock instead;
// extend it when a new Reanimated API is used. Animations resolve instantly to their target value.
jest.mock('react-native-reanimated', () => {
  const RN = require('react-native');
  const instant = value => value;
  const Animated = {
    View: RN.View,
    Text: RN.Text,
    Image: RN.Image,
    ScrollView: RN.ScrollView,
    createAnimatedComponent: component => component,
  };
  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    useSharedValue: initial => ({ value: initial }),
    useAnimatedStyle: factory => factory(),
    useDerivedValue: factory => ({ value: factory() }),
    withTiming: instant,
    withSpring: instant,
    cancelAnimation: () => {},
    runOnJS: fn => fn,
    Easing: { linear: instant, ease: instant },
  };
});

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest'),
);

jest.mock('react-native-bootsplash', () => ({
  hide: jest.fn(() => Promise.resolve()),
  isVisible: jest.fn(() => false),
  useHideAnimation: jest.fn(() => ({ container: {}, logo: {}, brand: {} })),
}));
