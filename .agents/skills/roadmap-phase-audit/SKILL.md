---
name: roadmap-phase-audit
description: >
  Audit whether a roadmap phase is actually implemented (not just claimed), or
  archive a completed roadmap. Use when a phase is marked done but needs proof, a
  branch/diff claims completion, or a finished roadmap must move to archive/.
---

# Roadmap Phase Audit

Use this skill to verify that a roadmap phase actually shipped, or to archive a
completed roadmap. The goal is evidence, not a summary of what a previous agent
claimed. Do not mark any checkbox complete without a file/line or diff hunk.

## Inputs

- Roadmap path — e.g. `docs/roadmaps/active/<name>.roadmap.md`.
- Phase number, packet scope, or "whole roadmap".
- Optional `--archive` to run the archive ritual after the audit passes.

If the target roadmap text disagrees with source code, trust source code and
note the discrepancy.

## Step 1: Read The Contract

- Read the phase's checklist items and acceptance criteria from the roadmap.
- Load `docs/roadmaps/standard/verification.md` for the checkbox and evidence policy.
- Extract: claimed-complete checkboxes, acceptance criteria, explicit non-goals,
  required validation commands, and the identifiers/patterns the phase was
  supposed to add or remove.

## Step 2: Map The Diff To Checklist Items

```bash
git diff main...HEAD --stat
```

Then take targeted per-file diffs for the changed files and map each change to a
specific checklist item. A change that maps to nothing is scope creep; a
checklist item that maps to no change is unimplemented.

## Step 3: Sweep For Leftovers

For any phase that was supposed to remove, rename, or replace something, grep the
whole repo (including tests, fixtures, docs, and generated-adjacent files) for:

- old identifiers the phase was supposed to remove,
- dual standards / both-old-and-new patterns coexisting,
- legacy patterns the roadmap declares superseded.

Enumerate every match into an explicit list. The audit **fails** if any remain.
Re-run each sweep at the end and paste the empty result as proof (see the
exhaustive-sweep rule in `AGENTS.md`).

## Step 4: Validate

Run the honest verification command:

```bash
pnpm run verify
```

(or `pnpm run check-types` + `pnpm run lint` if `verify` is unavailable). Record
the PASS/FAIL result. Missing validation output means the item cannot be marked
complete.

## Step 5: Gap Report

Produce a per-item table. Never mark a roadmap checkbox complete without evidence.

```md
| Checklist item | Verdict | Evidence |
| --- | --- | --- |
| <item> | IMPLEMENTED | `path/to/file.ts:42` / diff hunk |
| <item> | PARTIAL | <what is missing> |
| <item> | MISSING | no matching change found |
```

Verdicts: `IMPLEMENTED` (with file:line or diff hunk), `PARTIAL`, or `MISSING`.
Follow with the validation result and the leftover-sweep results.

## `--archive` Mode

Only after every checklist item is `IMPLEMENTED` and validation passes, run the
archive ritual per `docs/roadmaps/standard/archive.md`:

1. Confirm all checkboxes are complete (or have a deferral/supersession rationale).
2. Grep the repo for remaining mentions of the roadmap slug across other roadmaps
   and docs; update or remove stale links.
3. Move `docs/roadmaps/active/<slug>` to `docs/roadmaps/archive/`.
4. Update the indexes: `docs/roadmaps/README.md` and `docs/roadmaps/roadmap-audit.md`,
   plus `related_docs` / `supersedes` / `superseded_by` fields where relevant.
5. Set an archive status (`Completed and aligned`, `Historical`,
   `Superseded on purpose`, or `Rejected`) and ensure the file reads as history,
   not implementation instructions.

## Rules

- Prefer source code and command output over agent summaries.
- An item with no file/line or diff evidence is `MISSING`, not `IMPLEMENTED`.
- Do not broaden the audit beyond the requested phase unless the diff touched
  unrelated code.
- If validation was not or could not be run, say so explicitly and leave the
  affected checkboxes unchecked.
