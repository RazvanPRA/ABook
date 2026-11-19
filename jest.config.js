// Packages shipped as untranspiled ESM / Flow that Jest must run through Babel.
const ESM_PACKAGES = [
  '(jest-)?react-native(-[a-z-]+)?',
  '@react-native(-community)?',
  '@react-native-async-storage',
  '@react-native-documents',
  '@react-navigation',
  '@dr\\.pogodin',
  '@shopify/flash-list',
  'lucide-react-native',
  'uuid',
  '@noble',
  // Redux Toolkit / React Redux: Jest resolves them (and their deps) to their ESM builds
  'immer',
  'reselect',
  'redux(-thunk)?',
  'react-redux',
];

module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Jest resolves lucide to its .mjs build, which the RN transform (.js/.ts only) skips; use the CJS build
    '^lucide-react-native$':
      '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
  transformIgnorePatterns: [`node_modules/(?!(${ESM_PACKAGES.join('|')})/)`],
  // Coverage is collected only with --coverage (npm run check) and only for services/text, which must stay
  // at 100%. The threshold is global because Jest doesn't match path keys on Windows; widening
  // collectCoverageFrom therefore raises the bar for the new folders too.
  collectCoverageFrom: [
    'src/services/text/**/*.ts',
    '!**/__tests__/**',
    '!**/__fixtures__/**',
    '!src/services/text/index.ts',
    '!src/services/text/types.ts',
  ],
  coverageReporters: ['text-summary'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/__lint-fixtures__/',
  ],
};
