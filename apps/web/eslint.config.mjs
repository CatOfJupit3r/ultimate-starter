/**
 * THIS FILE WAS AUTO-GENERATED.
 * PLEASE DO NOT EDIT IT MANUALLY.
 * ===============================
 * IF YOU'RE COPYING THIS INTO AN ESLINT CONFIG, REMOVE THIS COMMENT BLOCK.
 */
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import pluginRouter from '@tanstack/eslint-plugin-router';
import { configs, plugins, rules } from 'eslint-config-airbnb-extended';
import { rules as prettierConfigRules } from 'eslint-config-prettier';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import tailwindcssPlugin from 'eslint-plugin-better-tailwindcss';
import prettierPlugin from 'eslint-plugin-prettier';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const gitignorePath = path.resolve('.', '.gitignore');
const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = path.dirname(currentFilename);
const tsconfigRootDir = path.resolve(currentDirname);
const tsconfigPath = path.resolve(tsconfigRootDir, 'tsconfig.json');
const tailwindConfigPath = path.join(currentDirname, 'src', 'index.css');

const jsConfig = [
  // ESLint Recommended Rules
  {
    name: 'js/config',
    ...js.configs.recommended,
  },
  // Stylistic Plugin
  plugins.stylistic,
  plugins.stylistic,
  // Import X Plugin
  plugins.importX,
  // Airbnb Base Recommended Config
  ...configs.base.recommended,
  // Strict Import Config
  rules.base.importsStrict,
];

const reactConfig = [
  // React Plugin
  plugins.react,
  // React Hooks Plugin
  plugins.reactHooks,
  // React JSX A11y Plugin
  plugins.reactA11y,
  // Airbnb React Recommended Config
  ...configs.react.recommended,
  // Strict React Config
  rules.react.strict,
  {
    files: ['**/*.{jsx,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'better-tailwindcss': tailwindcssPlugin,
    },
    rules: {
      ...tailwindcssPlugin.configs['stylistic-error'].rules,
      ...tailwindcssPlugin.configs['correctness-error'].rules,
      'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
      'better-tailwindcss/no-unregistered-classes': 'off',
    },
  },
  ...pluginRouter.configs['flat/recommended'],
];

const typescriptConfig = [
  // TypeScript ESLint Plugin
  plugins.typescriptEslint,
  // Airbnb Base TypeScript Config
  ...configs.base.typescript,
  // Strict TypeScript Config
  rules.typescript.typescriptEslintStrict,
  // Airbnb React TypeScript Config
  ...configs.react.typescript,
];

const prettierConfig = [
  // Prettier Plugin
  {
    name: 'prettier/plugin/config',
    plugins: {
      prettier: prettierPlugin,
    },
  },
  // Prettier Config
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
      'no-console': 'off', // not going to create observability epic any time soon, so allow console logs
      // if eslint won't shut up about unresolved imports for our path aliases, uncomment this:
      'import-x/no-unresolved': [
        'error',
        {
          ignore: ['^@startername/', '^@~/'],
        },
      ],
      'import-x/order': [
        'error',
        {
          // 👇 1. Custom grouping order
          groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],

          // 👇 define your path groups
          pathGroups: [
            {
              pattern: '@startername/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@startername/shared',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@~/**',
              group: 'internal',
              position: 'after',
            },
          ],

          // 👇 include internal alias matching
          pathGroupsExcludedImportTypes: ['builtin'],

          // 👇 2. Ignore alphabetical sorting within import lines
          alphabetize: {
            order: 'ignore',
            orderImportKind: 'ignore',
          },

          // 👇 Disable forcing alphabetical order of named imports
          named: { enabled: false },

          // Optional: one empty line between major groups for readability
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
      'no-void': ['error', { allowAsStatement: true }], // added for ^ rule
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
          format: ['PascalCase', 'camelCase', 'UPPER_CASE'],
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

const silenceWebOpinions = [
  {
    rules: {
      'react/function-component-definition': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-sort-props': 'off',
      'react/jsx-fragments': 'off',
      'react/require-default-props': 'off',
      '@typescript-eslint/no-use-before-define': [
        'error',
        {
          functions: false,
        },
      ],
      'jsx-a11y/label-has-associated-control': [
        'error',
        {
          labelComponents: ['Label'],
          labelAttributes: ['htmlFor'],
          controlComponents: ['Input', 'input', 'Textarea', 'textarea'],
          assert: 'either',
          depth: 3,
        },
      ],
    },
  },
];

export default [
  // Ignore .gitignore files/folder in eslint
  includeIgnoreFile(gitignorePath),
  {
    ignores: ['eslint.config.mjs', 'tests/**', 'dist/**', './src/routeTree.gen.ts', "vite.config.ts"],
  },
  {
    settings: {
      'better-tailwindcss': {
        entryPoint: tailwindConfigPath,
      },
    },
  },
  // Javascript Config
  ...jsConfig,
  // React Config
  ...reactConfig,
  // TypeScript Config
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
  // Prettier Config
  ...prettierConfig,
  ...silenceOpinions,
  ...silenceWebOpinions,
];
