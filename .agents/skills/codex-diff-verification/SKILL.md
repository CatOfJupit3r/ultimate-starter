---
name: codex-diff-verification
description: >
  Skeptically review an agent-made branch, PR, or diff against a roadmap packet or phase. Use Codex for high-trust verification after Claude Code or another implementation agent has made changes.
---

# Codex Diff Verification

Use this skill after an implementation agent changes code. The goal is to verify what is actually true, not to summarize what the previous agent claimed.

## When To Use

Use this skill when:

- Claude Code or another agent implemented a roadmap packet,
- a branch/PR claims a roadmap phase is complete,
- roadmap checkboxes were changed,
- validation output needs to be audited,
- the task touched contracts, server behavior, DB logic, AI features, or important UI flows,
- the user wants to conserve Codex budget by using Codex only for review.

## Inputs

Collect:

1. Roadmap path and phase/packet scope.
2. Branch, PR, or diff to review.
3. Completion report from the implementation agent, if available.
4. Command output from local checks, CI, or the implementation agent.

If no completion report exists, proceed from the diff and roadmap. Call out the missing report as a verification weakness.

## Step 1: Establish Review Contract

Read:

- `AGENTS.md`,
- target roadmap file,
- relevant skill files,
- changed files from the diff/PR,
- tests or command output.

Extract:

- claimed completed checkboxes,
- acceptance criteria,
- explicit non-goals,
- required validation commands,
- touched packages and feature areas.

## Step 2: Build Acceptance Matrix

Create a matrix like this:

| Roadmap item / acceptance criterion | Evidence found | Verdict |
|---|---|---|
| Counter visible in composer | `path/to/file.tsx` renders `n / max` | satisfied |
| Warning at 90% | no threshold logic found | not satisfied |
| Check-types passed | command output provided | verified |

Verdict values:

- `satisfied`
- `not satisfied`
- `partially satisfied`
- `cannot verify`
- `out of scope`

Do not infer satisfaction from intent. Require code or validation evidence.

## Step 3: Review For False Completion

Look specifically for:

- checkboxes marked `[x]` without matching implementation,
- command output missing or inconsistent with claims,
- tests added but not meaningful,
- acceptance criteria only partially implemented,
- source code contradicting roadmap updates,
- new TODOs/blockers hidden behind completed checkboxes,
- broad rewrites outside the requested packet,
- duplicated constants, types, or string literals that should use shared schemas,
- forbidden `index.ts` barrels or re-exports,
- raw string literals where schema-backed constants already exist,
- `z.enum`, raw string unions, or raw enum-backed comparisons where `Enumwaii` should be used,
- derived maps using bare keys instead of computed enum members,
- boolean names lacking `is`, `should`, `will`, `has`, or `does` prefixes,
- interface names missing the `i` prefix.

## Step 4: Review Architecture Fit

Check whether changes follow project conventions:

- contract-first for shared/server/web changes,
- shared constants/schemas in `packages/shared` when reused across apps,
- feature-based server and web layout,
- repository interfaces for persistence-heavy backend domains,
- direct imports instead of barrel exports,
- tests focused on behavior rather than implementation details.

For AI, Storyteller, memory, retrieval, and approval features, also check:

- approval boundaries,
- persisted vs transient state,
- event/stream semantics,
- traceability and observability,
- token/cost implications,
- failure behavior.

## Step 5: Decide Pass Or Needs Fixes

Use strict result labels:

- `PASS`: acceptance criteria are satisfied and validation evidence is adequate.
- `PASS WITH NOTES`: shippable, but minor follow-ups or optional improvements exist.
- `NEEDS FIXES`: required criteria are missing, validation failed/missing, or roadmap state is inaccurate.
- `BLOCKED`: cannot verify because required context, diff, or command output is missing.

Do not return `PASS` if command output is missing for required validation.

## Step 6: Produce Minimal Fix Plan

If fixes are needed, provide only the smallest safe fix plan.

Group findings by severity:

1. Blocking correctness issues.
2. Roadmap/checkbox truth issues.
3. Missing or weak validation.
4. Code quality or convention issues.
5. Optional polish.

For each issue include:

- evidence,
- why it matters,
- exact suggested fix,
- whether Claude Code can fix it mechanically or Codex should handle it.

## Output Format

```md
# Verification Result: PASS / PASS WITH NOTES / NEEDS FIXES / BLOCKED

## Scope Reviewed

- Roadmap: `<path>`
- Phase/packet: `<scope>`
- Diff/PR/branch: `<identifier>`

## Acceptance Matrix

| Item | Evidence | Verdict |
|---|---|---|
| ... | ... | ... |

## Validation Evidence

- `<command>`: pass / fail / not provided

## Findings

### Blocking
- ...

### Roadmap Truth
- ...

### Validation
- ...

### Code Quality
- ...

## Minimal Fix Plan

1. ...

## What Can Be Marked Complete

- `<checkbox>`

## What Must Stay Unchecked

- `<checkbox and reason>`
```

## Rules

- Be skeptical, not adversarial.
- Prefer source code and command output over agent summaries.
- Do not broaden review beyond the requested scope unless the diff changed unrelated code.
- Do not fix broad issues during verification unless the user explicitly asks.
- If the implementation is mostly correct but roadmap checkboxes are too optimistic, mark the result `NEEDS FIXES` until roadmap truth is restored.
