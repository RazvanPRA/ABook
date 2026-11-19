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

// @dr.pogodin/react-native-fs ships no mock, and importing it reads native constants. In-memory file
// system with the native semantics the app relies on: unlink/stat reject on a missing path, unlink
// removes a directory recursively, copyFile needs an existing source and parent directory, mkdir
// creates intermediate directories. Files are stored as sizes only. Tests seed it with __writeFile.
jest.mock('@dr.pogodin/react-native-fs', () => {
  const ROOT = '/data/user/0/com.abook/files';
  const files = new Map();
  const dirs = new Set();
  const parentOf = path => path.slice(0, path.lastIndexOf('/'));
  const missing = path => Promise.reject(new Error(`ENOENT: ${path}`));
  const under = (path, dir) => path.startsWith(`${dir}/`);
  const mkdirp = path => {
    for (let p = path; p.length > 0; p = parentOf(p)) {
      dirs.add(p);
    }
  };
  const reset = () => {
    files.clear();
    dirs.clear();
    mkdirp(ROOT);
  };
  reset();
  return {
    DocumentDirectoryPath: ROOT,
    __reset: reset,
    __writeFile: (path, size) => {
      mkdirp(parentOf(path));
      files.set(path, size);
    },
    exists: async path => files.has(path) || dirs.has(path),
    mkdir: async path => mkdirp(path),
    copyFile: async (from, into) => {
      if (!files.has(from)) return missing(from);
      if (!dirs.has(parentOf(into))) return missing(parentOf(into));
      files.set(into, files.get(from));
    },
    unlink: async path => {
      if (files.delete(path)) return;
      if (!dirs.has(path)) return missing(path);
      [...files.keys()]
        .filter(f => under(f, path))
        .forEach(f => files.delete(f));
      [...dirs]
        .filter(d => d === path || under(d, path))
        .forEach(d => dirs.delete(d));
    },
    stat: async path => {
      if (!files.has(path) && !dirs.has(path)) return missing(path);
      return {
        path,
        size: files.get(path) ?? 0,
        isFile: () => files.has(path),
      };
    },
    readdir: async path => {
      if (!dirs.has(path)) return missing(path);
      const children = [...files.keys(), ...dirs].filter(
        p => parentOf(p) === path,
      );
      return children.map(p => p.slice(path.length + 1));
    },
  };
});

jest.mock('react-native-bootsplash', () => ({
  hide: jest.fn(() => Promise.resolve()),
  isVisible: jest.fn(() => false),
  useHideAnimation: jest.fn(() => ({ container: {}, logo: {}, brand: {} })),
}));
