---
name: review-code
description: >
  Review code changes in this repository with a bug-finding mindset. Use when
  the user asks for a review, wants feedback on a diff or branch, or needs
  implementation risks and regressions called out concisely.
---

# Code Review

Use this skill when reviewing code changes in the repository.

## Review Standards

- Follow the guidance in `.agents/skills/review-code/GUIDELINES.md`.
- Prioritize bugs, regressions, risky behavior changes, and missing tests.
- Only raise findings when confidence is high.
- Keep comments concise and actionable.
- Comment on wording or clarity only when the text is genuinely confusing.

## Diff Selection

- If you are on `main`, ask the user what code they want reviewed.
- If you are on a feature branch, confirm the upstream branch when needed and review the diff against that branch.
- If no branch context is usable, ask the user for the specific diff or target comparison.

## Review Output

- Start with findings ordered by severity.
- Include concrete file references when possible.
- Cover implementation quality, consistency with the codebase, and potential bugs.
- Keep summaries brief and secondary to the findings.
- When the user wants the findings applied, the built-in `/code-review --fix` does review + fix in a single pass, avoiding the "review, then reply 'fix those issues'" two-step.
