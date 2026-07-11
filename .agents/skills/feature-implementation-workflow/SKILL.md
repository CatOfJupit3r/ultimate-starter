---
name: feature-implementation-workflow
description: >
  Budget-aware workflow for implementing a full-stack feature from a roadmap phase. Use when given a roadmap path and phase number to implement. Covers roadmap reading, task slicing, relevant skill loading, implementation with validation checkpoints, evidence-backed reporting, and roadmap checkbox updates.
---

# Feature Implementation Workflow

Agent-driven workflow for implementing a roadmap phase. The agent is given a roadmap file path and a phase number, reads the roadmap for context, loads relevant skills, slices broad work into small checkpoints when needed, implements the work, validates each checkpoint, and marks roadmap items complete only when evidence supports completion.

## Entry Point

The user provides:

1. **Roadmap path** — e.g. `docs/roadmaps/active/ai-improvements.roadmap.md`
2. **Phase number or packet scope** — e.g. `Phase 4` or a specific unchecked checkbox
3. Optional execution mode:
   - `Codex plan only`
   - `Claude implementation handoff`
   - `Codex implementation`
   - `Codex verification`
   - `mixed-agent workflow`

Start by reading the full roadmap file to understand scope, acceptance criteria, and what is already implemented.

## Step 0: Choose The Right Mode

Before writing code, decide whether the request should be implemented directly or split.

Use `roadmap-task-slicing` first when:

- the phase has more than 2-3 unchecked implementation items,
- the phase touches multiple packages or architectural layers,
- the user wants to conserve Codex usage,
- Claude Code or another implementation agent will do the bulk work,
- previous agent work needs stronger verification.

Use `agent-implementation-proof` when delegating implementation to another coding agent.

Use `codex-diff-verification` when reviewing a branch, PR, or diff after another agent has made changes.

For small, low-risk tasks, continue with this workflow directly.

## Step 1: Read The Roadmap

```text
read_file: docs/roadmaps/active/ai-improvements.roadmap.md
```

Extract from the roadmap:

- the phase's items and their current completion status,
- any items already marked completed (skip those),
- the phase exit criteria,
- acceptance criteria that apply to the phase,
- verification commands,
- referenced files, schemas, docs, or existing code,
- non-goals and explicit deferrals.

If a phase contains sub-items, treat each unchecked item as an atomic unit of work unless the roadmap explicitly requires them to ship together.

If roadmap text differs from the actual source code, trust source code over the roadmap and note the discrepancy.

## Step 2: Load Relevant Skills

Load skills lazily to conserve context: instead of front-loading every referenced skill, load only the skills whose domain the phase's checklist items actually touch, and load each one at the point you start that work. Use the decision heuristic below.

| Work type | Load skill |
|---|---|
| Broad roadmap phase or budget-sensitive implementation | `roadmap-task-slicing` |
| Delegating implementation to Claude Code or another agent | `agent-implementation-proof` |
| Reviewing another agent's branch, PR, or diff | `codex-diff-verification` |
| Database schema or migrations | `drizzle-orm` |
| New oRPC contracts / API endpoints | `orpc-contract-creation` |
| Server router handlers | `server-router-implementation` |
| Error handling, access control | `server-error-handling` |
| DI setup, new services | `dependency-injection-setup` |
| TanStack Query hooks / mutations | `tanstack-query-integration` |
| React components, forms, routes | `react-component-patterns` |
| Forms with TanStack Form + Zod | `tanstack-forms` |
| Tests | `repository-testing-workflow` |

Do not load every skill. Load the smallest useful set.

## Step 3: Explore Relevant Code

To keep the working context lean, delegate the initial reconnaissance to an `Explore` subagent instead of reading broadly inline. Ask it to "locate the files, patterns, and existing implementations this phase touches; return paths and one-line descriptions, not file contents." Use its report to understand:

- existing patterns for the feature area,
- where new files should be placed,
- what should be reused,
- what must not be rebuilt,
- which tests already cover the surface.

Then do targeted reads only for the exact files you will edit. Do not rely on roadmap claims alone.

## Step 4: Slice Or Implement

### If The Phase Is Broad

Use `roadmap-task-slicing` and produce atomic work packets before editing code.

Each packet should include:

- one clear outcome,
- likely files,
- acceptance criteria,
- validation commands,
- executor recommendation,
- non-goals,
- what may be marked complete after validation.

Prefer this loop:

1. Codex or planning agent slices the phase.
2. Claude Code implements one packet with `agent-implementation-proof`.
3. Local validation runs narrow checks.
4. Codex verifies the diff with `codex-diff-verification`.
5. Claude Code fixes any review findings.
6. Final validation runs.

### If The Task Is Small Enough To Implement Directly

Implement each unchecked roadmap item in order. Always follow `AGENTS.md` and loaded skills.

Implementation order for full-stack items:

1. Schema / migration, if data layer changes.
2. Shared contracts, constants, schemas, and error codes.
3. Server router handlers, repositories, resolvers, and services.
4. Frontend query/mutation hooks.
5. UI components, routes, and forms.
6. Tests and roadmap updates.

## Step 5: Validate Incrementally

After each meaningful unit of work, run the narrowest relevant validation command. Route all verification through `pnpm run verify`, which reports honest PASS/FAIL and a trustworthy exit code. Scope it while iterating:

```bash
pnpm run verify --filter web
pnpm run verify --filter server
pnpm run verify --filter @startername/shared
```

Run the unscoped command when changes cross packages:

```bash
pnpm run verify
```

Do not interleave formatting with edits — run `pnpm run prettify` once at the end of the phase, never between edits, to avoid stale-file races.

Use `repository-testing-workflow` to choose tests, and add `--tests` to `pnpm run verify` to run them. Do not write tests that only verify framework behavior or static rendering without meaningful behavior.

If type errors or tests fail, fix the root cause before continuing. Do not accumulate validation debt across roadmap items.

## Step 6: Mark Roadmap Items Completed

A roadmap checkbox may be marked `[x]` only after:

1. the implementation is present,
2. the relevant acceptance criteria are satisfied,
3. the narrow validation command passed,
4. any required test or manual QA evidence is recorded,
5. no known blocker remains for that checkbox.

Use the roadmap's own checkbox format. Example:

```markdown
- [ ] Implement usage tracking for AI runs
```

becomes:

```markdown
- [x] Implement usage tracking for AI runs
```

Mark items one at a time as they are completed. Do not batch-mark at the end.

If a roadmap item is too large or blocked, implement what is possible, leave the checkbox unchecked, and report the blocker.

## Step 7: Final Validation Checkpoint

After all items in the selected scope are done, run the full verification and format once:

```bash
pnpm run verify
pnpm run prettify
```

For cross-package or full-stack work, add `--tests` to `pnpm run verify` (or run the relevant tests from `repository-testing-workflow`).

Fix remaining issues before declaring the selected scope complete.

If validation cannot be run, say exactly what was not run and why. Do not claim completion without validation evidence.

## Step 8: Evidence-Backed Report

End with a report that can be audited.

```md
## Completion Report

### Implemented
- <item> — evidence: <files>, validation: <command/result>

### Already Done / Skipped
- <item> — reason: <why skipped>

### Not Done / Blocked
- <item> — reason: <blocker or deferral>

### Commands Run
- `<command>` — pass/fail/not run

### Roadmap Updates
- Marked complete: <checkboxes>
- Left unchecked: <checkboxes and why>

### Remaining Risk
- <risk or none>
```

## Skill-to-Work Mapping Quick Reference

When you encounter these patterns, load the corresponding skill if not already loaded:

- broad phase, too many checkboxes, token budget concern -> `roadmap-task-slicing`
- Claude Code handoff, another agent will implement -> `agent-implementation-proof`
- branch/PR/diff review, false-completion check -> `codex-diff-verification`
- `z.enum`, creating reusable enums -> `enumwaii`
- `pgTable(`, `drizzle`, migration -> `drizzle-orm`
- `oc.route(`, `.input(`, `.output(`, contract file -> `orpc-contract-creation`
- `protectedProcedure`, `.handler(` -> `server-router-implementation`
- `ORPCNotFoundError`, `ORPCForbiddenError`, `errorCodes` -> `server-error-handling`
- `@injectable()`, `container.resolve(`, `LoggerFactory` -> `dependency-injection-setup`
- `tanstackRPC.`, `queryOptions`, `mutationOptions` -> `tanstack-query-integration`
- `useAppForm`, `withForm`, `withFieldGroup` -> `tanstack-forms`
- `test(`, `describe(`, `createTestContext`, `test.describe(` -> `repository-testing-workflow`

## Notes

- Prefer small, evidence-backed packets over giant phase implementations.
- Never skip validation between broad units of work.
- If a roadmap item is already marked `[x]`, skip it entirely unless the user asks for verification.
- If source code contradicts roadmap current-state text, trust source code and note the discrepancy.
- Do not let the same agent both make broad changes and self-certify completion when trust matters.
