import tsParser from '@typescript-eslint/parser';
import { ESLint, type Linter } from 'eslint';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { noRawEnumComparisonRule } from '../src/eslint-rules/no-raw-enum-comparison';
import { noRawEnumMemberRule } from '../src/eslint-rules/no-raw-enum-member';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const RULE_ID = 'enumwaii/no-raw-enum-comparison';

const eslint = new ESLint({
  cwd: packageRoot,
  overrideConfigFile: true,
  overrideConfig: {
    files: ['**/*.ts'],
    languageOptions: {
      // typescript-eslint's flat-config parser and rule types are wider than
      // eslint's core Linter types, hence the casts.
      parser: tsParser as unknown as Linter.Parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: packageRoot,
      },
    },
    plugins: {
      enumwaii: {
        rules: {
          'no-raw-enum-comparison': noRawEnumComparisonRule,
          'no-raw-enum-member': noRawEnumMemberRule,
        },
      } as unknown as ESLint.Plugin,
    },
    rules: {
      [RULE_ID]: 'error',
      'enumwaii/no-raw-enum-member': 'error',
    },
  },
});

describe('no-raw-enum-comparison', () => {
  it('flags raw string comparisons and switch cases while allowing enum members', async () => {
    const results = await eslint.lintFiles([path.join(packageRoot, 'test/fixtures/raw-comparison.fixture.ts')]);
    const result = results[0];
    if (!result) {
      throw new Error('expected the fixture to produce a lint result');
    }

    const ruleMessages = result.messages.filter((message) => message.ruleId === RULE_ID);
    const reportedSnippets = ruleMessages.map(
      (message) => `${message.messageId}:${message.message.match(/'[^']*'|"[^"]*"/u)?.[0] ?? ''}`,
    );

    expect(reportedSnippets).toEqual(["rawComparison:'ADMIN'", "rawComparison:'USER'", "rawSwitchCase:'ADMIN'"]);
    expect(result.messages.filter((message) => message.ruleId !== RULE_ID)).toEqual([]);
  }, 30_000);
});

describe('no-raw-enum-member', () => {
  it('requires computed members in derived maps and subset member lists', async () => {
    const ruleId = 'enumwaii/no-raw-enum-member';
    const results = await eslint.lintFiles([path.join(packageRoot, 'test/fixtures/raw-member.fixture.ts')]);
    const result = results[0];
    if (!result) {
      throw new Error('expected the fixture to produce a lint result');
    }

    expect(result.messages.filter((message) => message.ruleId === ruleId).map((message) => message.messageId)).toEqual([
      'rawDerivedKey',
      'rawDerivedKey',
      'rawSubsetMember',
      'rawSubsetMember',
    ]);
    expect(result.messages.filter((message) => message.ruleId !== ruleId)).toEqual([]);
  }, 30_000);
});
