/**
 * ESLint flat config (ESLint 9).
 * Enforces the `modular-architecture` skill: size limits (§2), layers and dependency direction (§3),
 * plus the project rules from .claude/PROMPT.md (no Expo, storage only in storage/ + repositories/,
 * no hex colors outside the theme). Sentinel tests in __tests__/lint prove the rules are active.
 */
const rnConfig = require('@react-native/eslint-config/flat');
const boundaries = require('eslint-plugin-boundaries');
const importPlugin = require('eslint-plugin-import');
const maxProps = require('./eslint-rules/max-props');

const localPlugin = { rules: { 'max-props': maxProps } };

const TS_FILES = ['**/*.ts', '**/*.tsx'];
const SRC_FILES = ['src/**/*.{ts,tsx}'];
const TEST_FILES = ['**/__tests__/**', '**/*.test.{ts,tsx,js}'];

const THEME_FILES = 'src/shared/theme/**';
const KEYS_FILE = 'src/storage/keys.ts';
const HEX_SELECTOR = {
  selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
  message: 'Use theme tokens (src/shared/theme), not hex colors.',
};
const KEY_MESSAGE =
  'Build storage keys with the helpers in src/storage/keys.ts, not string literals.';
const KEY_SELECTORS = [
  { selector: 'Literal[value=/^abk:/]', message: KEY_MESSAGE },
  { selector: 'TemplateElement[value.raw=/^abk:/]', message: KEY_MESSAGE },
];

const STORAGE_MODULES = [
  '@react-native-async-storage/async-storage',
  '@dr.pogodin/react-native-fs',
];
const EXPO_PATTERNS = [
  {
    group: ['expo', 'expo-*', '@expo/*'],
    message: 'ABook uses React Native CLI: no Expo packages.',
  },
];

// Feature / layer elements; `feature` captures its name so cross-feature imports can be limited to index.ts.
const ELEMENTS = [
  { type: 'app', pattern: 'src/app' },
  { type: 'feature', pattern: 'src/features/*', capture: ['feature'] },
  { type: 'service', pattern: 'src/services/*', capture: ['service'] },
  { type: 'repository', pattern: 'src/repositories' },
  { type: 'storage', pattern: 'src/storage' },
  { type: 'shared', pattern: 'src/shared/*', capture: ['module'] },
];

const allow = (from, to, extra = {}) => ({
  from: { element: { type: from } },
  allow: { to: { element: { types: to } }, ...extra },
});

const LAYER_POLICIES = [
  allow('app', [
    'app',
    'feature',
    'service',
    'repository',
    'storage',
    'shared',
  ]),
  allow('feature', ['service', 'shared']),
  // Features see repositories only as interfaces (types); implementations are injected in app/dependencies.ts
  allow('feature', ['repository'], {
    dependency: { kind: ['type', 'typeof'] },
  }),
  // Inside the same feature: anything
  {
    from: { element: { type: 'feature' } },
    allow: {
      to: {
        element: {
          type: 'feature',
          captured: { feature: '{{ from.element.captured.feature }}' },
        },
      },
    },
  },
  // Another feature: only through its public index.ts
  {
    from: { element: { type: 'feature' } },
    allow: {
      to: { element: { type: 'feature', fileInternalPath: 'index.ts' } },
    },
  },
  allow('service', ['service', 'shared']),
  allow('repository', ['repository', 'storage', 'shared']),
  allow('storage', ['storage', 'shared']),
  allow('shared', ['shared']),
];

// ABook has no Flow code, and eslint-plugin-ft-flow (bundled by the RN config) crashes on ESLint 9
// (context.getAllComments). Keep the Babel parser for .js files, drop the ft-flow plugin and rules.
const withoutFlow = rnConfig.map(cfg => {
  if (!cfg.plugins || !cfg.plugins['ft-flow']) {
    return cfg;
  }
  const { plugins, rules, settings, ...rest } = cfg;
  return rest;
});

module.exports = [
  {
    ignores: [
      'node_modules/',
      'android/',
      'ios/',
      'coverage/',
      '.bundle/',
      'vendor/',
      '**/__lint-fixtures__/**',
    ],
  },
  ...withoutFlow,

  // Jest setup/config files run with Jest globals
  {
    files: ['jest.setup.js', 'jest.config.js'],
    languageOptions: { globals: { jest: 'readonly' } },
  },

  // Strict TypeScript (skill §8)
  {
    files: TS_FILES,
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },

  // Global limits (skill §2)
  {
    files: SRC_FILES,
    ignores: TEST_FILES,
    rules: {
      'max-params': ['error', 3],
      complexity: ['error', 10],
      'max-depth': ['error', 4],
      'react/jsx-max-depth': ['error', { max: 4 }],
    },
  },
  // ≤ 7 props per component (skill §2); local rule in eslint-rules/max-props.js
  {
    files: SRC_FILES,
    ignores: TEST_FILES,
    plugins: { local: localPlugin },
    rules: { 'local/max-props': ['error', { max: 7 }] },
  },
  {
    files: ['src/**/components/**/*.tsx', 'src/shared/ui/**/*.tsx'],
    ignores: TEST_FILES,
    rules: {
      'max-lines': [
        'error',
        { max: 150, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    files: ['src/**/screens/**/*.tsx'],
    ignores: TEST_FILES,
    rules: {
      'max-lines': [
        'error',
        { max: 120, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    files: ['src/**/hooks/**/use*.ts'],
    ignores: TEST_FILES,
    rules: {
      'max-lines': [
        'error',
        { max: 80, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    files: [
      'src/services/**/*.ts',
      'src/features/*/services/**/*.ts',
      'src/shared/utils/**/*.ts',
      'src/repositories/**/*.ts',
      'src/storage/**/*.ts',
    ],
    ignores: TEST_FILES,
    rules: {
      'max-lines': [
        'error',
        { max: 200, skipBlankLines: true, skipComments: true },
      ],
      'max-lines-per-function': [
        'error',
        { max: 40, skipBlankLines: true, skipComments: true },
      ],
    },
  },

  // Forbidden imports: Expo everywhere; storage libraries outside storage/ and repositories/
  {
    files: ['**/*.{js,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...EXPO_PATTERNS,
            {
              group: STORAGE_MODULES,
              message:
                'Only src/storage and src/repositories may use AsyncStorage or the file system.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/storage/**', 'src/repositories/**', 'jest.setup.js'],
    rules: { 'no-restricted-imports': ['error', { patterns: EXPO_PATTERNS }] },
  },

  // No hex colors outside the theme tokens; no storage key literals outside storage/keys.ts.
  // Both use no-restricted-syntax, and a later block replaces the rule's options, so each block
  // lists exactly the selectors that apply to its files.
  {
    files: SRC_FILES,
    ignores: [THEME_FILES, KEYS_FILE, ...TEST_FILES],
    rules: {
      'no-restricted-syntax': ['error', HEX_SELECTOR, ...KEY_SELECTORS],
    },
  },
  {
    files: [THEME_FILES],
    ignores: TEST_FILES,
    rules: { 'no-restricted-syntax': ['error', ...KEY_SELECTORS] },
  },
  {
    files: [KEYS_FILE],
    rules: { 'no-restricted-syntax': ['error', HEX_SELECTOR] },
  },

  // Layers and dependency direction (skill §3) + no circular imports
  {
    files: SRC_FILES,
    plugins: { boundaries, import: importPlugin },
    settings: {
      'boundaries/elements': ELEMENTS,
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
        node: true,
      },
      'import/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
      'import/extensions': ['.ts', '.tsx', '.js'],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        { default: 'disallow', policies: LAYER_POLICIES },
      ],
      // disableScc: the SCC pre-computation crashes on files not yet on disk (editor buffers, sentinel tests)
      'import/no-cycle': ['error', { ignoreExternal: true, disableScc: true }],
    },
  },
];
