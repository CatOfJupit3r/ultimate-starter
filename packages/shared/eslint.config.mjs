import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import { configs, plugins, rules } from 'eslint-config-airbnb-extended';
import { rules as prettierConfigRules } from 'eslint-config-prettier';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import prettierPlugin from 'eslint-plugin-prettier';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const gitignorePath = path.resolve('.', '.gitignore');
const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = path.dirname(currentFilename);
const tsconfigRootDir = path.resolve(currentDirname);
const tsconfigPath = path.resolve(tsconfigRootDir, 'tsconfig.json');

const jsConfig = [
  {
    name: 'js/config',
    ...js.configs.recommended,
  },
  plugins.stylistic,
  plugins.importX,
  ...configs.base.recommended,
  rules.base.importsStrict,
];

const nodeConfig = [plugins.node, ...configs.node.recommended];

const typescriptConfig = [
  plugins.typescriptEslint,
  ...configs.base.typescript,
  rules.typescript.typescriptEslintStrict,
];

const prettierConfig = [
  {
    name: 'prettier/plugin/config',
    plugins: {
      prettier: prettierPlugin,
    },
  },
  {
    name: 'prettier/config',
    rules: {
      ...prettierConfigRules,
      'prettier/prettier': [
        'warn',
        {
          endOfLine: 'auto',
        },
      ],
    },
  },
];

const silenceOpinions = [
  {
    rules: {
      'import-x/prefer-default-export': 'off',
      'no-console': 'off',
      'import-x/no-unresolved': [
        'error',
        {
          ignore: ['^@startername/', '^@~/'],
        },
      ],
      'import-x/order': [
        'error',
        {
          groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],
          pathGroups: [
            { pattern: '@startername/**', group: 'internal', position: 'before' },
            { pattern: '@startername/shared', group: 'internal', position: 'after' },
            { pattern: '@~/**', group: 'internal', position: 'after' },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          alphabetize: { order: 'ignore', orderImportKind: 'ignore' },
          named: { enabled: false },
          'newlines-between': 'always',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'TSVoidKeyword:not(TSInterfaceDeclaration TSVoidKeyword, TSAbstractMethodDefinition TSVoidKeyword, TSAbstractPropertyDefinition TSVoidKeyword, TSTypeAliasDeclaration TSVoidKeyword, TSDeclareFunction TSVoidKeyword, TSMethodSignature TSVoidKeyword, MethodDefinition:not([value.body]) TSVoidKeyword)',
          message:
            'Using explicit `void` or `Promise<void>` is not encouraged. Please either do not specify a return type or specify the type.',
        },
        {
          selector: 'TSEnumDeclaration',
          message: "Avoid using 'enum' as a type. Use `const SOME_ENUM = { VALUE: 'VALUE'; } as const` instead.",
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],
      'no-void': ['error', { allowAsStatement: true }],
      'import-x/no-named-as-default': 'off',
      'class-methods-use-this': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          prefix: ['i'],
        },
        {
          selector: 'variable',
          types: ['boolean'],
          format: ['PascalCase', 'camelCase'],
          prefix: ['is', 'should', 'has', 'can', 'did', 'will', 'have', 'might'],
        },
      ],
      '@typescript-eslint/only-throw-error': 'off',
      'import-x/no-anonymous-default-export': 'off',
      '@typescript-eslint/array-type': 'off',
      'no-underscore-dangle': [
        'error',
        {
          allow: ['__dirname', '__filename', '_id', '_doc', '_meta'],
        },
      ],
    },
  },
];

export default [
  {
    ignores: ['eslint.config.mjs', 'test/**', 'dist/**', 'tsdown.config.ts'],
  },
  includeIgnoreFile(gitignorePath),
  ...jsConfig,
  ...nodeConfig,
  ...typescriptConfig,
  {
    name: 'typescript/parser-options',
    languageOptions: {
      parserOptions: {
        tsconfigRootDir,
        // project: tsconfigPath,
      },
    },
  },
  {
    name: 'typescript/import-resolver',
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          // project: tsconfigPath,
          alwaysTryTypes: true,
          bun: true,
        }),
      ],
    },
  },
  ...prettierConfig,
  ...silenceOpinions,
];
