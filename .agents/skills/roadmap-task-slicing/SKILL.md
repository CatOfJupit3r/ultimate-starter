---
name: roadmap-task-slicing
description: >
  Split a large roadmap phase into small, evidence-backed work packets before implementation. Use when a roadmap phase is broad, touches multiple apps/packages, would consume too much Codex budget, or should be delegated across agents such as Codex and Claude Code.
---

# Roadmap Task Slicing

Use this skill before implementation when a roadmap phase is too broad for one safe agent pass. The goal is to turn a roadmap phase into small packets that can be implemented, verified, and reviewed independently.

## When To Use

Use this skill when:

- the user asks to implement one or more roadmap phases,
- the phase touches multiple packages, features, routes, contracts, or UI surfaces,
- the phase has more than 2-3 unchecked implementation items,
- Codex usage budget matters,
- Claude Code or another bulk implementation agent will do the mechanical work,
- a previous agent claimed completion without enough evidence.

Do not use this skill for tiny, single-file fixes.

## Inputs

The user or calling agent should provide:

1. Roadmap path, such as `docs/roadmaps/active/ux-improvements.roadmap.md`.
2. Phase number or checkbox scope.
3. Optional executor preference, such as Codex-only, Claude-first, or mixed-agent.

## Step 1: Read Ground Truth

Read these before slicing:

1. `AGENTS.md`
2. The target roadmap file
3. Any directly relevant `.agents/skills/*/SKILL.md` mappings from `AGENTS.md`
4. Current source files referenced by the roadmap

If roadmap text conflicts with source code, trust source code and call out the discrepancy.

## Step 2: Extract The Phase Contract

For the selected phase, extract:

- unchecked implementation items,
- exit criteria,
- acceptance criteria that apply to the phase,
- verification commands,
- dependencies or "must not start until" constraints,
- files or features explicitly in scope,
- non-goals and forbidden rewrites.

Do not include future-roadmap ideas or deferred work in the implementation path.

## Step 3: Slice Into Atomic Work Packets

Create work packets that are small enough to complete and verify independently.

A good packet has:

- one clear outcome,
- a small file surface,
- explicit acceptance criteria,
- a narrow validation command,
- no hidden dependency on later packets,
- a clear owner recommendation.

Prefer packets like:

```md
### Packet 1: Message composer character counter

**Goal:** Add visible `n / max` counter to the chat composer.
**Executor:** Claude Code first, Codex review after diff.
**Likely files:**
- `apps/web/src/features/chats/...`

**Acceptance criteria:**
- Counter is visible.
- Counter updates while typing.
- Counter warns at 90% of the configured limit.

**Validation:**
- `pnpm --filter=web run check-types`
- relevant web/component test if added or updated

**Do not touch:**
- unrelated chat message rendering
- backend contracts
```

Avoid packets like:

```md
Implement Phase 1 polish.
```

## Step 4: Choose Executor Per Packet

Use this decision table:

| Work type | Preferred executor |
|---|---|
| Architecture, contract shape, DB model, AI trust/memory behavior | Codex |
| Repetitive UI implementation, import cleanup, copy changes, mechanical refactors | Claude Code |
| Hard failing test diagnosis after Claude gets stuck | Codex |
| Final completion audit against roadmap criteria | Codex |
| Formatting, lint auto-fixes, obvious local cleanup | Claude Code or local shell |

Default pattern:

1. Codex creates the slice and risk plan.
2. Claude implements one packet.
3. Local shell runs narrow validation.
4. Codex reviews the diff skeptically.
5. Claude fixes review findings.
6. Local shell runs final validation.

## Step 5: Define Verification Gates

Each packet must include:

- narrow package checks, such as `pnpm --filter=web run check-types`,
- broader root checks only when cross-package changes exist,
- the exact test surface to use if tests are needed,
- manual QA steps only when automation is not enough,
- whether roadmap checkboxes may be marked after completion.

Never allow checkboxes to be marked complete from code changes alone. Require command output or reviewable manual evidence.

## Step 6: Produce A Handoff Prompt

For each packet, produce a copy-paste-ready implementation prompt.

Use this template:

```md
Implement ONLY this packet: <packet name>

Required reading:
- `AGENTS.md`
- `<roadmap path>`
- `<relevant skill files>`

Scope:
- <specific items>

Hard constraints:
- Do not broaden scope.
- Do not rewrite unrelated code.
- Follow existing patterns before creating new abstractions.
- Do not mark roadmap checkboxes unless validation passes.
- Do not create new docs unless this packet explicitly requires docs.

Validation:
- Run <narrow commands>.
- Include exact command output in the completion report.

Completion report must include:
- changed files,
- roadmap items satisfied/not satisfied,
- commands actually run,
- remaining risks or blockers.
```

## Output Format

Return:

1. Phase summary.
2. Atomic packet list in recommended order.
3. Parallelization notes.
4. Executor recommendations.
5. Validation gates.
6. Copy-paste prompts for the next 1-3 packets.
7. Items that must remain unchecked until later verification.

## Rules

- Keep packets small enough for safe agent execution.
- Prefer evidence from current source code over roadmap claims.
- Separate implementation from verification.
- Do not let one agent both make broad changes and self-certify completion.
- Preserve roadmap deferrals and non-goals.
- If the phase is already partly implemented, slice only the real missing work.
