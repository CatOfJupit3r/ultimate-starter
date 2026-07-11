---
name: enumwaii
description: >
  Mandatory: declare and consume closed sets of string values (statuses, roles, modes,
  kinds, event types) with `@startername/enumwaii`, never `z.enum` or raw string unions.
  Read before writing, editing, or reviewing any enum-like value.
---

# Enumwaii

`@startername/enumwaii` (`packages/enumwaii`) is this repository's only convention for closed sets of string values. It keeps members as ordinary strings at runtime while making raw literals and values from unrelated enums fail type checking. This skill is mandatory reading before declaring, comparing, or reviewing any enum-like value — do not use `z.enum`, TypeScript `enum`, or a plain `as const` object for this purpose.

Use it for domain values that cross layers or drive behavior: statuses, kinds, modes, roles, event types, sources, actions, and tabs. Keep genuinely open-ended data as `string`.

## Naming convention

Internal enum values MUST use `CONSTANT_CASE` (for example, `READY_TO_CREATE`, `CHARACTER_SPRITE`). Keep kebab-case or snake_case only when the value is an external wire contract or an intentional exception — web URL/query-facing values, tool names, compatibility-layer values, provider IDs, environment values, model/message roles, or similar. Exceptions still require a named schema and exported accessor; do not scatter raw strings.

## The standard shape

Declare an enum once, then export its members, type, and schema from the same module.

```ts
import { Enumwaii, type InferEnumwaii } from '@startername/enumwaii/enumwaii';

const storyStageModesEnumwaii = new Enumwaii('StoryStageMode', ['REGULAR', 'READER', 'CINEMATIC']);

export const STORY_STAGE_MODES = storyStageModesEnumwaii.enum;
export type StoryStageMode = InferEnumwaii<typeof storyStageModesEnumwaii>;
export const storyStageModeSchema = storyStageModesEnumwaii.schema;
```

`new Enumwaii(...)` is the only declaration form. Use a unique, stable PascalCase enum name — it is part of the type identity. Place shared, non-sensitive enums in `packages/shared/src/constants` and import them from `@startername/shared/constants`; feature-local values stay with their feature.

## Use members, never raw values

Use the exported member accessor everywhere a known value is required: defaults, comparisons, function arguments, test fixtures, and object construction. Do not use `schema.enum.VALUE` at call sites — import and use the exported accessor (`STORY_STAGE_MODES.REGULAR`).

```ts
const defaultMode = STORY_STAGE_MODES.REGULAR;

if (stage.mode === STORY_STAGE_MODES.CINEMATIC) {
  enableCinematicLayout();
}
```

```ts
// Does not type check: raw values cannot enter an enum-typed position.
const defaultMode: StoryStageMode = 'REGULAR';
```

This also prevents accidental interchange between independent domains that happen to share a literal (two different `Enumwaii` instances with a `"READY"` member are not interchangeable).

## Validate at boundaries

Use the schema in contracts and forms. Use `parse`, `safeParse`, or `is` when accepting unknown data from a database, JSON, query parameter, provider, or external API.

```ts
export const updateStageSchema = z.object({
  mode: storyStageModeSchema,
});
```

```ts
const mode = storyStageModesEnumwaii.parse(requestedMode);

if (storyStageModesEnumwaii.is(value)) {
  // value is StoryStageMode here
}
```

## Derive exhaustive metadata

Use `derive` for a value required for every enum member (labels, icons, permissions, routes). Always use computed member keys — it rejects missing and unknown keys at runtime.

```ts
const STORY_STAGE_MODE_LABELS = storyStageModesEnumwaii.derive({
  [STORY_STAGE_MODES.REGULAR]: 'Regular',
  [STORY_STAGE_MODES.READER]: 'Reader',
  [STORY_STAGE_MODES.CINEMATIC]: 'Cinematic',
});

const label = STORY_STAGE_MODE_LABELS(stage.mode);
```

Use `deriveWith` when every value can be built from the member itself: `storyStageModesEnumwaii.deriveWith((mode) => mode.toLowerCase())`.

Use the callable table (`LABELS(value)`) or `.get(value)` for lookup; branded values cannot safely bracket-index a record. Use `.record` only when plain-object iteration or interop is necessary.

## Compose related enums deliberately

Use `extend` for a true superset, and `pick` or `omit` for a runtime subset — all three preserve the parent enum identity.

```ts
const generatedAssetTypesEnumwaii = storyStageAssetTypesEnumwaii.pick('GeneratedAssetType', [
  STORY_STAGE_ASSET_TYPES.BACKGROUND,
  STORY_STAGE_ASSET_TYPES.CHARACTER_SPRITE,
]);
```

Do not create a second enum merely because it happens to have the same values — compose it from the owning enum when it represents the same domain. Independently declare similar-looking values when they represent different domains; enumwaii keeps them separate.

## Enforce with lint

Enable both bundled ESLint rules in every config that touches enum values:

```js
import { noRawEnumComparisonRule } from '@startername/enumwaii/eslint-rules/no-raw-enum-comparison';
import { noRawEnumMemberRule } from '@startername/enumwaii/eslint-rules/no-raw-enum-member';

export default [
  {
    plugins: { enumwaii: { rules: { 'no-raw-enum-comparison': noRawEnumComparisonRule, 'no-raw-enum-member': noRawEnumMemberRule } } },
    rules: {
      'enumwaii/no-raw-enum-comparison': 'error',
      'enumwaii/no-raw-enum-member': 'error',
    },
  },
];
```

`no-raw-enum-comparison` reports raw `===`/`switch` literals against a branded value; `no-raw-enum-member` reports raw string keys in a `derive` mapping.

## Drizzle, DTOs, and serialization

Enumwaii values are plain strings at runtime, so JSON and oRPC transport preserve them without ceremony, but neither can prove a string was valid before it reached the process.

- For oRPC, use the enum's `schema` in both input and output contracts — input validation promotes an incoming string to the branded type, output validation rejects an invalid repository result before it becomes a DTO.
- For Drizzle, map the column with `.$type<T>()` for the branded application type, but that is compile-time only. Add a PostgreSQL enum or check constraint as the durable database invariant; if the table is legacy or lacks that constraint, parse the field in the repository mapper before returning it:

```ts
return { ...row, mode: storyStageModesEnumwaii.parse(row.mode) };
```

## Checklist

- Declare a named `Enumwaii` object and export its member accessor, inferred type, and schema — never `z.enum`, TypeScript `enum`, or `as const`.
- Internal values are `CONSTANT_CASE`; external wire-facing exceptions still go through a named schema and accessor.
- Use enum members for known values; parse or validate unknown values at boundaries.
- Use `derive`/`deriveWith` for metadata that must cover all members; use computed member keys.
- Use `pick`, `omit`, or `extend` for related domains instead of duplicating value lists.
- Enable both enumwaii ESLint rules wherever enums are consumed.
- Keep enum names unique and stable — the name is part of the type identity.

See [`docs/reference/enumwaii-guide.md`](../../../docs/reference/enumwaii-guide.md) for the full reference and a worked migration example.
