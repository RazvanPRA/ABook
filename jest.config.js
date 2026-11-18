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
];

module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transformIgnorePatterns: [`node_modules/(?!(${ESM_PACKAGES.join('|')})/)`],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/__lint-fixtures__/',
  ],
};
