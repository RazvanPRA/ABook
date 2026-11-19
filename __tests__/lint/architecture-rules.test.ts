/// <reference types="node" />
/**
 * @jest-environment node
 *
 * Sentinel tests: prove that the architecture rules in eslint.config.js are really active.
 * Each case lints a virtual file placed in a real layer folder and checks which rule fires.
 * Import targets are real files, created in a temporary __lint-fixtures__ folder and removed afterwards.
 */
import fs from 'fs';
import path from 'path';
import { ESLint } from 'eslint';

jest.setTimeout(60000);

const ROOT = path.resolve(__dirname, '..', '..');
const FIXTURE_DIRS = ['src/features/player', 'src/features/library'].map(d =>
  path.join(ROOT, d, '__lint-fixtures__'),
);

let eslint: ESLint;

beforeAll(() => {
  for (const dir of FIXTURE_DIRS) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'internal.ts'),
      'export const internal = 1;\n',
    );
  }
  // The config is passed in directly: ESLint loads config files with a dynamic import(), which Jest's VM does not support.
  const config = require(path.join(ROOT, 'eslint.config.js'));
  eslint = new ESLint({
    cwd: ROOT,
    ignore: false,
    overrideConfigFile: true,
    overrideConfig: config,
  });
});

afterAll(() => {
  for (const dir of FIXTURE_DIRS) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

async function ruleIds(file: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, {
    filePath: path.join(ROOT, file),
  });
  return (result?.messages ?? []).map(m => m.ruleId ?? `fatal: ${m.message}`);
}

const FEATURE_FILE = 'src/features/library/sentinel.ts';

describe('layers and dependency direction (boundaries)', () => {
  it.each([
    [
      'another feature internals',
      FEATURE_FILE,
      "import { internal } from '@/features/player/__lint-fixtures__/internal';\nexport const x = internal;\n",
    ],
    [
      'service -> feature',
      'src/services/text/sentinel.ts',
      "import '@/features/player';\n",
    ],
    [
      'shared -> feature',
      'src/shared/utils/sentinel.ts',
      "import '@/features/player';\n",
    ],
    [
      'storage -> repository',
      'src/storage/sentinel.ts',
      "import '@/repositories';\n",
    ],
    [
      'feature -> repository value import',
      FEATURE_FILE,
      "import '@/repositories';\n",
    ],
    ['feature -> storage', FEATURE_FILE, "import '@/storage';\n"],
  ])('rejects %s', async (_name, file, code) => {
    expect(await ruleIds(file, code)).toContain('boundaries/dependencies');
  });

  it.each([
    [
      'another feature through index.ts',
      FEATURE_FILE,
      "import '@/features/player';\n",
    ],
    [
      'own feature internals',
      FEATURE_FILE,
      "import { internal } from './__lint-fixtures__/internal';\nexport const x = internal;\n",
    ],
    [
      'feature -> service and shared',
      FEATURE_FILE,
      "import '@/services/text';\nimport '@/shared/ui';\n",
    ],
    [
      'feature -> repository type import',
      FEATURE_FILE,
      "import type { Repo } from '@/repositories';\nexport type X = Repo;\n",
    ],
    [
      'repository -> storage',
      'src/repositories/sentinel.ts',
      "import '@/storage';\n",
    ],
    [
      'external packages',
      FEATURE_FILE,
      "import React from 'react';\nexport const x = React;\n",
    ],
  ])('allows %s', async (_name, file, code) => {
    expect(await ruleIds(file, code)).toEqual([]);
  });
});

describe('forbidden imports', () => {
  it('rejects Expo packages anywhere', async () => {
    expect(
      await ruleIds('src/storage/sentinel.ts', "import 'expo-speech';\n"),
    ).toContain('no-restricted-imports');
    expect(await ruleIds('index.js', "import 'expo-file-system';\n")).toContain(
      'no-restricted-imports',
    );
  });

  it('allows storage libraries only in storage/ and repositories/', async () => {
    const code =
      "import AsyncStorage from '@react-native-async-storage/async-storage';\nexport const s = AsyncStorage;\n";
    expect(await ruleIds(FEATURE_FILE, code)).toContain(
      'no-restricted-imports',
    );
    expect(await ruleIds('src/storage/sentinel.ts', code)).toEqual([]);
  });
});

describe('tokens and size limits', () => {
  it('rejects hex colors outside the theme', async () => {
    const code = "export const c = '#F0B13C';\n";
    expect(await ruleIds(FEATURE_FILE, code)).toContain('no-restricted-syntax');
    expect(await ruleIds('src/shared/theme/sentinel.ts', code)).toEqual([]);
  });

  it('rejects more than 3 parameters', async () => {
    const code =
      'export const f = (a: number, b: number, c: number, d: number) => a + b + c + d;\n';
    expect(await ruleIds('src/services/text/sentinel.ts', code)).toContain(
      'max-params',
    );
  });

  it('rejects service functions over 40 lines', async () => {
    const body = Array.from(
      { length: 41 },
      (_, i) => `  const v${i} = ${i};`,
    ).join('\n');
    const code = `export function f() {\n${body}\n  return v0;\n}\n`;
    expect(await ruleIds('src/services/text/sentinel.ts', code)).toContain(
      'max-lines-per-function',
    );
  });

  it('rejects any and non-null assertions', async () => {
    const code = 'export const f = (a: any, b?: string) => b!.length + a;\n';
    const ids = await ruleIds('src/services/text/sentinel.ts', code);
    expect(ids).toEqual(
      expect.arrayContaining([
        '@typescript-eslint/no-explicit-any',
        '@typescript-eslint/no-non-null-assertion',
      ]),
    );
  });
});

describe('max 7 props per component (local/max-props)', () => {
  const UI_FILE = 'src/shared/ui/Sentinel/Sentinel.types.ts';
  const members = (n: number) =>
    Array.from({ length: n }, (_, i) => `  p${i}: string;`).join('\n');
  const params = (n: number) =>
    Array.from({ length: n }, (_, i) => `p${i}`).join(', ');

  it('rejects an interface with 8 props', async () => {
    const code = `export interface SentinelProps {\n${members(8)}\n}\n`;
    expect(await ruleIds(UI_FILE, code)).toContain('local/max-props');
  });

  it('rejects 8 props spread over an intersection of literals', async () => {
    const code = `export type SentinelProps = {\n${members(4)}\n} & {\n${members(4).replace(/p/g, 'q')}\n};\n`;
    expect(await ruleIds(UI_FILE, code)).toContain('local/max-props');
  });

  it('rejects a component destructuring 8 props', async () => {
    const code = `export function Sentinel({ ${params(8)} }: Record<string, string>) {\n  return [${params(8)}];\n}\n`;
    expect(
      await ruleIds('src/shared/ui/Sentinel/Sentinel.tsx', code),
    ).toContain('local/max-props');
  });

  it('allows 7 props, rest elements and non-Props types', async () => {
    const ok = [
      `export interface SentinelProps {\n${members(7)}\n}\n`,
      `export interface SentinelOptions {\n${members(9)}\n}\n`,
      `export const Sentinel = ({ ${params(7)}, ...rest }: Record<string, string>) => [${params(7)}, rest];\n`,
    ];
    for (const code of ok) {
      expect(await ruleIds(UI_FILE, code)).not.toContain('local/max-props');
    }
  });
});

describe('circular imports', () => {
  it('rejects a cycle between two files', async () => {
    const dir = FIXTURE_DIRS[1] as string;
    fs.writeFileSync(
      path.join(dir, 'a.ts'),
      "import { b } from './b';\nexport const a = b;\n",
    );
    fs.writeFileSync(
      path.join(dir, 'b.ts'),
      "import { a } from './a';\nexport const b = () => a;\n",
    );
    const code = fs.readFileSync(path.join(dir, 'a.ts'), 'utf8');
    expect(
      await ruleIds('src/features/library/__lint-fixtures__/a.ts', code),
    ).toContain('import/no-cycle');
  });
});
