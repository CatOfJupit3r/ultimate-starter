---
name: agent-implementation-proof
description: >
  Require evidence-backed completion reports from Claude Code or any implementation agent. Use when delegating roadmap packets, refactors, or feature work to an agent that may overstate completion.
---

# Agent Implementation Proof

Use this skill when an implementation agent is expected to change code and report completion. The purpose is to prevent false completion claims by requiring file evidence, command evidence, and explicit unchecked work.

## When To Use

Use this skill when:

- delegating work to Claude Code or another coding agent,
- implementing a roadmap packet created by `roadmap-task-slicing`,
- asking an agent to update roadmap checkboxes,
- a task spans multiple files,
- the user cares about reliability more than optimistic summaries,
- previous work was claimed as complete but later proved incomplete.

## Core Rule

An agent may not claim work is done unless it provides reviewable evidence.

Forbidden unsupported claims:

- "done"
- "implemented"
- "all tests pass"
- "roadmap phase complete"
- "I fixed everything"

These claims are only allowed when paired with exact file evidence and validation evidence.

## Required Delegation Prompt

When delegating, include this block:

```md
Proof requirements:

Do not say "done", "implemented", "completed", "all tests pass", or mark roadmap checkboxes unless you include evidence.

Your final report must include:

1. Roadmap items touched
   - original checkbox text
   - status: implemented / partially implemented / not implemented
   - evidence: changed files and validation command

2. Commands actually run
   - command
   - result
   - relevant output or failure excerpt

3. Git diff summary
   - files changed
   - notable additions
   - notable deletions

4. Things not done
   - unchecked roadmap items
   - blockers
   - follow-up needed

If validation was not run, say exactly: "Validation not run" and explain why.
If an item is too large or blocked, leave its roadmap checkbox unchecked.
```

## Roadmap Checkbox Policy

A roadmap checkbox may be changed from `[ ]` to `[x]` only when all are true:

1. The implementation is present in the source code.
2. The relevant acceptance criteria are satisfied.
3. The narrow validation command passed.
4. The agent reports the exact command that passed.
5. No known blocker remains for that checkbox.

Do not batch-mark all checkboxes at the end. Mark only the item that has passed its validation gate.

## Validation Strategy

Prefer narrow commands first:

```bash
pnpm --filter=web run check-types
pnpm --filter=server run check-types
pnpm --filter=@startername/shared run check-types
```

Then broaden only when the change crosses packages:

```bash
pnpm run check-types
pnpm run lint
```

Run tests based on the changed surface:

| Changed surface | Expected validation |
|---|---|
| Server service/router/auth/DB logic | server integration or unit test |
| Shared contract/schema/constants | shared build/check-types plus dependent package check |
| Web component/hook/state behavior | web test or component-level verification |
| E2E-critical user flow | Playwright spec or explicit manual QA note |
| Docs-only roadmap change | markdown review; no code checks required unless code changed |

## Completion Report Template

Require this exact structure:

```md
## Completion Report

### 1. Roadmap Items Touched

- `<original checkbox text>`
  - Status: implemented / partially implemented / not implemented
  - Evidence: `<files>`
  - Validation: `<command + result>`

### 2. Commands Actually Run

```bash
<command>
```

Result: pass / fail / not run
Relevant output:

```text
<output excerpt>
```

### 3. Git Diff Summary

- Files changed: `<count>`
- Added: `<summary>`
- Modified: `<summary>`
- Deleted: `<summary>`

### 4. Things Not Done

- `<unchecked item or blocker>`

### 5. Roadmap Checkbox Changes

- Marked complete: `<items>`
- Left unchecked: `<items and why>`
```

## Reviewer Checklist

When reviewing a completion report, reject it if:

- it claims tests pass without command output,
- it marks roadmap items without matching changed files,
- it says validation was skipped but still claims completion,
- it uses vague phrases instead of acceptance-criteria evidence,
- it changes unrelated files without explanation,
- it leaves source and roadmap state inconsistent.

## Rules

- Evidence beats confidence.
- Failed validation is useful information, not a reason to hide output.
- Roadmap checkboxes are state, not vibes.
- A partially completed packet should be reported as partial and left unchecked.
- Do not ask the implementation agent to self-review broad architecture after making broad changes; hand the diff to a separate verification pass.
