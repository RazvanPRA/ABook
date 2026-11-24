// Official mocks of native modules, so component tests run without a device.
require('react-native-gesture-handler/jestSetup');
// FlashList measures its items; the mock gives it a 400×900 window and 100×100 items.
require('@shopify/flash-list/jestSetup');

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
    withRepeat: instant,
    useReducedMotion: jest.fn(() => false),
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
// creates intermediate directories, read(…, 'base64') returns the bytes cut at the end of the file.
// Files are byte buffers; tests seed them with __writeFile(path, bytes | size), a size meaning zeros.
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
    __writeFile: (path, content) => {
      mkdirp(parentOf(path));
      files.set(
        path,
        typeof content === 'number'
          ? Buffer.alloc(content)
          : Buffer.from(content),
      );
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
        size: files.get(path)?.length ?? 0,
        isFile: () => files.has(path),
      };
    },
    read: async (path, length, position, encoding) => {
      if (!files.has(path)) return missing(path);
      if (encoding !== 'base64') {
        throw new Error(`mock read supports base64 only, got ${encoding}`);
      }
      return files
        .get(path)
        .subarray(position, position + length)
        .toString('base64');
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

// react-native-webview needs its native component. The mock renders a View (testID 'webview') carrying
// the props, so tests call onMessage / onError on it; `posted` is what RN posted into this instance.
jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  class WebView extends React.Component {
    posted = [];
    postMessage = message => this.posted.push(message);
    render() {
      return React.createElement(View, {
        testID: 'webview',
        ...this.props,
        posted: this.posted,
      });
    }
  }
  return { __esModule: true, WebView, default: WebView };
});

// The app's own TurboModule: silent in Jest. Tests of speech use services/tts/testing.
jest.mock('./specs/NativeAbookTts', () => ({
  __esModule: true,
  default: {
    getVoices: jest.fn(async () => []),
    speak: jest.fn(),
    stop: jest.fn(async () => {}),
    isSpeaking: jest.fn(async () => false),
    openSettings: jest.fn(async () => {}),
    showPlayback: jest.fn(),
    hidePlayback: jest.fn(),
    onUtterance: jest.fn(() => ({ remove: () => {} })),
    onPlaybackCommand: jest.fn(() => ({ remove: () => {} })),
  },
}));

jest.mock('react-native-bootsplash', () => ({
  hide: jest.fn(() => Promise.resolve()),
  isVisible: jest.fn(() => false),
  useHideAnimation: jest.fn(() => ({ container: {}, logo: {}, brand: {} })),
}));

// Native module: the app uses only pick() through services/picker, whose tests inject their own pick.
jest.mock('@react-native-documents/picker', () => {
  const errorCodes = {
    OPERATION_CANCELED: 'OPERATION_CANCELED',
    IN_PROGRESS: 'ASYNC_OP_IN_PROGRESS',
    UNABLE_TO_OPEN_FILE_TYPE: 'UNABLE_TO_OPEN_FILE_TYPE',
    NULL_PRESENTER: 'NULL_PRESENTER',
  };
  return {
    pick: jest.fn(() => Promise.reject(new Error('pick is not mocked'))),
    keepLocalCopy: jest.fn(),
    types: { pdf: 'application/pdf' },
    errorCodes,
    isErrorWithCode: error =>
      typeof error === 'object' && error !== null && 'code' in error,
  };
});
