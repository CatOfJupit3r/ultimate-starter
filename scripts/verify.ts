#!/usr/bin/env tsx
/**
 * Canonical verification command for agents and humans. This is the ONLY
 * command agents should run to check types, lint, or test - never invoke
 * `tsc`, `tsgo`, `eslint`, or `vitest` directly, and never call
 * `pnpm run check-types` / `pnpm run lint` / `pnpm run test` directly either.
 *
 * Runs check-types + lint (and optionally tests) as Node child processes so the
 * exit code is honest. Spawning pnpm from Node avoids the Windows PowerShell 5.1
 * behaviour of wrapping native stderr as `NativeCommandError`, which makes
 * successful pnpm runs look like failures.
 *
 * Usage:
 *   pnpm run verify                                    # check-types + lint across the workspace
 *   pnpm run verify --tests                            # also run the test suite
 *   pnpm run verify --filter web                       # scope every step to a single package
 *   pnpm run verify --files apps/server/src/foo.ts ...  # lint exactly these files; scope
 *                                                       # check-types to the packages that own them
 */

import { spawn } from 'node:child_process';
import path from 'node:path';

interface iStepResult {
  name: string;
  passed: boolean;
  errorLines: string[];
}

const args = process.argv.slice(2);
const shouldRunTests = args.includes('--tests');

const WORKSPACE_ROOTS = ['apps', 'packages', 'configs'] as const;

function readFilter(): string | null {
  const flagIndex = args.findIndex((arg) => arg === '--filter');
  if (flagIndex !== -1) return args[flagIndex + 1] ?? null;

  const inline = args.find((arg) => arg.startsWith('--filter='));
  return inline ? inline.slice('--filter='.length) : null;
}

function readFiles(): string[] {
  const flagIndex = args.findIndex((arg) => arg === '--files');
  if (flagIndex === -1) return [];
  return args.slice(flagIndex + 1).filter((arg) => !arg.startsWith('--'));
}

const filter = readFilter();
const files = readFiles();

/** First two path segments (e.g. `apps/server`) for a file under a workspace root, or null. */
function packageDirFor(filePath: string): string | null {
  const normalized = filePath.split(path.sep).join('/');
  const segments = normalized.split('/');
  if (segments.length < 2) return null;
  if (!(WORKSPACE_ROOTS as readonly string[]).includes(segments[0])) return null;
  return `${segments[0]}/${segments[1]}`;
}

const fileGroups = new Map<string, string[]>();
for (const file of files) {
  const dir = packageDirFor(file);
  if (!dir) continue;
  const relativeToPackage = file.split(path.sep).join('/').slice(dir.length + 1);
  const existing = fileGroups.get(dir) ?? [];
  existing.push(relativeToPackage);
  fileGroups.set(dir, existing);
}

const packageDirs = [...fileGroups.keys()];

// When --files is given, scope check-types/test to just the owning packages.
// Otherwise fall back to --filter (single package) or --recursive (whole workspace).
const scopeArgs =
  files.length > 0
    ? packageDirs.map((dir) => `--filter=./${dir}`)
    : filter
      ? [`--filter=${filter}`]
      : ['--recursive'];

const MAX_ERROR_LINES = 30;

// Lines worth surfacing verbatim: TS diagnostics, ESLint rows, and vitest failures.
const ERROR_LINE_PATTERNS = [
  /error TS\d+/, // tsgo / tsc
  /\s(error|warning)\s{2,}/i, // ESLint stylish rows: "12:5  error  message  rule"
  /^\s*(FAIL|✗|×|❯.*✗)/, // vitest failure markers
  /\d+\s+failed/i, // vitest / test summaries
  /Error:/, // generic runtime failures from a step
];

function extractErrorLines(output: string): string[] {
  const seen = new Set<string>();
  const collected: string[] = [];

  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line.trim()) continue;
    if (!ERROR_LINE_PATTERNS.some((pattern) => pattern.test(line))) continue;
    if (seen.has(line)) continue;

    seen.add(line);
    collected.push(line.trim());
  }

  return collected;
}

function runCommand(name: string, command: string): Promise<iStepResult> {
  return new Promise((resolve) => {
    // A single shelled command string resolves the `pnpm` shim on Windows and
    // runs through cmd.exe, which does not wrap stderr the way PowerShell 5.1
    // does. Every argument here is workspace-controlled (package.json scopes,
    // repo-relative file paths).
    const child = spawn(command, { shell: true });

    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      output += chunk.toString();
    });

    child.on('error', (error) => {
      output += `\nError: failed to spawn step "${name}": ${error.message}`;
      resolve({ name, passed: false, errorLines: extractErrorLines(output) });
    });

    child.on('close', (code) => {
      resolve({ name, passed: code === 0, errorLines: extractErrorLines(output) });
    });
  });
}

async function runLintStep(): Promise<iStepResult> {
  if (files.length === 0) {
    return runCommand('lint', `pnpm ${scopeArgs.join(' ')} --stream run lint`);
  }

  // File-scoped lint: run eslint directly inside each owning package instead
  // of the package's `lint` script (which always targets the whole package).
  const results = await Promise.all(
    [...fileGroups.entries()].map(([dir, relativeFiles]) =>
      runCommand('lint', `pnpm --filter=./${dir} exec eslint --fix ${relativeFiles.join(' ')}`),
    ),
  );

  return {
    name: 'lint',
    passed: results.every((result) => result.passed),
    errorLines: results.flatMap((result) => result.errorLines),
  };
}

async function main() {
  if (files.length > 0 && packageDirs.length === 0) {
    console.log('=== verify summary ===');
    console.log('FAIL files');
    console.log('errors: 1');
    console.log('--- first errors ---');
    console.log(`Error: none of the --files paths resolved to a workspace package (expected apps/*, packages/*, or configs/*)`);
    process.exit(1);
  }

  const results: iStepResult[] = [];

  results.push(await runCommand('check-types', `pnpm ${scopeArgs.join(' ')} --stream --no-bail run check-types`));
  results.push(await runLintStep());

  if (shouldRunTests) {
    results.push(await runCommand('test', `pnpm ${scopeArgs.join(' ')} --stream run test`));
  }

  const totalErrorLines = results.reduce((sum, result) => sum + result.errorLines.length, 0);
  const allPassed = results.every((result) => result.passed);

  console.log('=== verify summary ===');
  for (const result of results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}`);
  }
  console.log(`errors: ${totalErrorLines}`);

  if (!allPassed) {
    const errorLines = results.flatMap((result) => result.errorLines).slice(0, MAX_ERROR_LINES);
    console.log('--- first errors ---');
    for (const line of errorLines) {
      console.log(line);
    }
  }

  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  console.error('Error: verify script crashed:', error);
  process.exit(1);
});
