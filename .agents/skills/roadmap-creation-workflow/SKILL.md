---
name: roadmap-creation-workflow
description: >
  Create new roadmaps from rough ideas, research notes, feature requests,
  stale plans, or architectural direction. Use when Codex needs to generate a
  roadmap skeleton, turn repo reality into a source-of-truth roadmap, replace or
  supersede an older roadmap, or prepare a roadmap that later agents can
  implement and audit safely.
---

# Roadmap Creation Workflow

Create roadmaps that are concise, source-backed, agent-executable, and ready to become the repository's source of truth.

Do not treat a roadmap as an idea dump. Treat it as a planning artifact that must stay trustworthy during implementation, audit, and archive.

## Use This Skill For

- creating a new roadmap from a rough product or engineering idea,
- turning research notes into a roadmap,
- replacing or superseding an older roadmap,
- converting a stale roadmap into a clearer source of truth,
- creating an implementation-ready roadmap for Codex, Claude Code, or mixed-agent work,
- generating a standards-compliant roadmap skeleton and then filling it in.

Do not use this skill for tiny bugs, single-file tasks, or normal issue tickets.

## Read First

Always read:

1. `AGENTS.md`
2. `docs/roadmaps/standard.md`
3. `docs/roadmaps/standard/README.md`

Then load only the standard modules needed for the current creation pass:

| Task | Load |
| --- | --- |
| Generate the skeleton | `docs/roadmaps/standard/generation.md` |
| Set metadata and filename | `docs/roadmaps/standard/metadata.md` |
| Fill roadmap sections | `docs/roadmaps/standard/structure.md` |
| Audit current repo reality | `docs/roadmaps/standard/current-state.md` |
| Add scenarios or user stories | `docs/roadmaps/standard/use-cases.md` |
| Describe architecture and constraints | `docs/roadmaps/standard/architecture.md` |
| Shape phases | `docs/roadmaps/standard/phases.md` |
| Define validation | `docs/roadmaps/standard/verification.md` |
| Record deferrals or supersession | `docs/roadmaps/standard/decisions.md` |
| Prepare archive readiness and index updates | `docs/roadmaps/standard/archive.md` |

Load these extra skills only when needed:

- `.agents/skills/roadmap-task-slicing/SKILL.md` for broad phases that are too large for one agent pass
- `.agents/skills/agent-implementation-proof/SKILL.md` when Claude Code or another implementation agent will do the work
- `.agents/skills/codex-diff-verification/SKILL.md` when verifying broad agent-made roadmap implementation

## Project Rules

- Trust source code over old roadmap text.
- Protect shipped work from rebuilds by naming it explicitly in current state.
- Prefer direct replacement over compatibility bridges unless the roadmap explicitly justifies a migration path.
- Keep phases small enough for an agent to execute and verify safely.
- Use decisions and deferrals to kill zombie backlog instead of leaving stale unchecked boxes.
- Update `docs/roadmaps/README.md` and `docs/roadmaps/roadmap-audit.md` when a real active roadmap is created, renamed, archived, or superseded.
- Avoid broad new docs unless the roadmap itself is the requested deliverable.

## Inputs

Expect any mix of:

- rough feature idea,
- product direction,
- architectural concern,
- research notes,
- old roadmap text,
- repo area or module name,
- desired priority,
- desired roadmap type,
- whether the roadmap should replace an old concept,
- whether the roadmap is for near-term implementation or longer-term planning.

If priority is missing, default to `P1`.

If the roadmap type is missing, infer from the dominant concern:

| Concern | `roadmap_type` |
| --- | --- |
| Product feature | `feature-epic` |
| Storyteller, Plotwright, approvals, memory, AI runtime | `agentic-epic` |
| UX or accessibility improvements | `ux-polish` |
| Package or runtime structure | `architecture` |
| Cutover, replacement, persistence transition | `migration` |
| Boilerplate, cleanup, debt reduction | `cleanup` |
| Test expansion or E2E planning | `testing` |
| Telemetry, traces, cost or observability | `observability` |
| Repo-backed exploration with no committed delivery shape yet | `research` |
| Follow-up archive or stale-roadmap cleanup | `closure` |

## Workflow

### Step 1: Classify The Roadmap

Determine:

- what problem the roadmap exists to solve,
- who is affected,
- whether it is active backlog or exploration,
- whether it supersedes an older roadmap, implementation, or terminology,
- whether it should be implemented soon or preserved as a planning record.

If the user already gave enough direction, proceed without stopping for clarification. Make reasonable assumptions and record them in the roadmap text.

### Step 2: Choose The Creation Mode

Use one of these modes:

- `Skeleton-first`: generate the file immediately, then fill it in.
- `Draft-first`: shape the roadmap in chat first when the user wants review before file creation.
- `Supersede`: replace an older roadmap or stale concept and explicitly record what is shipped, stale, deferred, rejected, or replaced.
- `Research-to-roadmap`: turn research into project-specific decisions without pasting the research dump into the roadmap.

Default to `Skeleton-first` when the user asks to create a real roadmap in the repo.

### Step 3: Generate The Skeleton

When creating the file, use:

```bash
pnpm run roadmap:create -- --title "Roadmap Title" --slug roadmap-slug --type feature-epic --priority P1
```

Run this command outside of sandbox

The generator creates `docs/roadmaps/active/<slug>/` containing `<slug>.roadmap.md` plus companion verification, rollout, decisions, archive, and changelog files.

Do not leave the generated placeholders as-is. Replace, narrow, or delete them based on actual repo reality.

### Step 4: Audit Current Repository Reality

Before writing active implementation phases, inspect the real repository state.

Check only the surfaces that matter, such as:

- `packages/shared/src/contract/`
- `packages/shared/src/constants/`
- `packages/shared/src/enums/`
- `packages/shared/src/schemas/`
- `apps/server/src/db/schema/`
- `apps/server/src/features/`
- `apps/server/src/routers/`
- `apps/web/src/features/`
- `apps/web/src/routes/`
- `apps/server/test/`
- `apps/web/test/`
- `docs/knowledge-base/`
- related files under `docs/roadmaps/`

Write evidence-backed current state. Prefer tables with source paths over vague prose.

Good:

```md
| Area | Current state | Evidence |
| --- | --- | --- |
| Story development workspace | Story detail already includes scene ideas, memory, and continuity panels | `apps/web/src/features/stories/...`, `apps/server/src/features/stories/...` |
```

Bad:

```md
Story planning looks partially implemented.
```

Call out:

- shipped work that must not be rebuilt,
- real missing work,
- intentionally deferred work,
- stale roadmap claims,
- superseded concepts.

### Step 5: Define The Boundary

Write the roadmap so future agents can tell what to do and what not to do.

Make these sections concrete:

- `Problem / Opportunity`
- `Goals`
- `Non-Goals`
- `Design Principles And Constraints`

Use non-goals aggressively. roadmaps benefit from explicit no-gos such as:

- do not create a parallel agent runtime,
- do not revive legacy terminology that the new model replaces,
- do not build a compatibility bridge unless the roadmap explicitly requires it,
- do not broaden the roadmap into unrelated docs or platform work.

### Step 6: Pick The Scenario Shape

Use:

- product use cases for user-facing work,
- system scenarios for internal architecture,
- agent scenarios for Storyteller, Plotwright, memory, approval, retrieval, tool, or runtime behavior.

Keep acceptance criteria testable. Avoid vague future language.

### Step 7: Define Target Architecture

Describe only the architecture that constrains delivery.

For full-stack work, cover the relevant pieces:

- shared contracts and constants,
- server services, repositories, routers, and schema impact,
- web routes, hooks, components, forms, and state,
- tests and verification surfaces,
- rollout or migration behavior if old concepts are being removed.

For agentic work, explicitly cover:

- role boundaries,
- approval boundaries,
- transient versus persisted state,
- tool and retrieval boundaries,
- event or stream behavior,
- observability and failure behavior.

### Step 8: Create Small Phases

Use the standard phase shape from `docs/roadmaps/standard/phases.md`.

Phase rules:

- keep each phase a coherent checkpoint,
- avoid mixing unrelated surfaces,
- move future-maybe work into decisions or deferrals,
- split large phases before implementation,
- note when later implementation must use `roadmap-task-slicing`.

If a phase would touch multiple packages, routes, contracts, and tests at once, it is probably too large.

### Step 9: Add Verification

Use the smallest useful verification set from `docs/roadmaps/standard/verification.md`.

Common commands:

```bash
pnpm --filter=web run check-types
pnpm --filter=server run check-types
pnpm --filter=@startername/shared run check-types
pnpm run check-types
pnpm run lint
pnpm run test
```

Do not attach every command to every roadmap. Match validation to the changed surface.

For docs-only roadmap work, code checks are not required unless code also changed.

### Step 10: Record Decisions, Deferrals, And Supersession

Use `docs/roadmaps/standard/decisions.md` to prevent false backlog.

When an old idea is no longer valid:

- mark it deferred, rejected, or superseded,
- explain why,
- point to the replacement roadmap or implementation when possible.

Never leave intentionally replaced work as an open checkbox.

### Step 11: Update Indexes

When the roadmap is a real repo artifact, update:

- `docs/roadmaps/README.md`
- `docs/roadmaps/roadmap-audit.md`

Also update metadata links such as:

- `related_docs`
- `supersedes`
- `superseded_by`

If the roadmap is only being drafted in chat, call out that the index updates are still pending.

## Roadmap Quality Gate

Before finishing, verify:

- frontmatter matches `metadata.md`,
- status matches the roadmap folder,
- current state is backed by repo evidence,
- shipped work is protected from rebuild,
- real missing work is separated from stale docs,
- phases are small enough for agents,
- acceptance criteria are testable,
- verification names real checks,
- decisions capture deferrals and superseded work,
- archive conditions are concrete,
- README and audit updates are included when needed.

## Output

Report the result in this shape:

```md
## Roadmap Created

- Path: `<path>`
- Status: `<status>`
- Type: `<roadmap_type>`
- Priority: `<priority>`

## Source Evidence Checked

- `<path>`
- `<path>`

## Major Decisions

- `<decision>`

## Implementation Shape

- Phase 1: `<summary>`
- Phase 2: `<summary>`

## Verification Plan

- `<command or QA path>`

## Follow-Up

- `<remaining audit, pruning, or index work>`
```

## Handoff

If the roadmap is ready for implementation:

1. Load `.agents/skills/roadmap-task-slicing/SKILL.md`.
2. Slice the next phase into small packets.
3. Use `.agents/skills/agent-implementation-proof/SKILL.md` if another agent will implement the packets.
4. Use `.agents/skills/codex-diff-verification/SKILL.md` before trusting broad completion claims.
5. Mark roadmap checkboxes complete only after validation evidence exists.
