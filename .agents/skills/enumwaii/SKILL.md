---
name: enumwaii
description: >
  Mandatory: declare and consume closed sets of string values with the npm
  package enumwaii, never z.enum or raw string unions.
  Read before writing, editing, or reviewing any enum-like value.
---

# Enumwaii

Use the published `enumwaii` package for statuses, kinds, modes, roles, events,
sources, actions, and tabs. Keep open-ended data as `string`. Members remain
strings at runtime and are branded in TypeScript. Internal values must use
`CONSTANT_CASE`; preserve externally required wire values.

## Declare once

```ts
import { em } from 'enumwaii';
import { emToZodSchema } from 'enumwaii/zod';

const storyStageModesEnumwaii = em(['REGULAR', 'READER', 'CINEMATIC']);
export const STORY_STAGE_MODES = storyStageModesEnumwaii.enum;
export type StoryStageMode = (typeof storyStageModesEnumwaii)['~type'];
export const storyStageModeSchema = emToZodSchema(storyStageModesEnumwaii);
```

Use `em([...])`. Put shared non-sensitive values under
`packages/common/src/constants`; feature-local values stay with their feature.
Extract the member accessor and use it for defaults, comparisons, arguments,
fixtures, and object construction. Never scatter raw enum values.

## Validate at boundaries

Declarations implement Standard Schema v1 and can be passed directly to compatible
consumers. For Zod contracts and forms use `emToZodSchema(enumeration)`, which
preserves branded outputs. There is no declaration `.schema` property.

Use `.parse(input)`, `.safeParse(input)`, or `.is(input)` for untrusted data.
Parsing accepts `{ default: MEMBER }` for nil input and `{ fallback: MEMBER }`
for invalid input. Zod-specific refinements and recovery belong on the adapter.

## Derive exhaustive metadata

```ts
const STORY_STAGE_MODE_LABELS = storyStageModesEnumwaii.derive(
  [STORY_STAGE_MODES.REGULAR, 'Regular'],
  [STORY_STAGE_MODES.READER, 'Reader'],
  [STORY_STAGE_MODES.CINEMATIC, 'Cinematic'],
);
const label = STORY_STAGE_MODE_LABELS.get(STORY_STAGE_MODES.REGULAR);
```

Use owned members as tuple keys. Derivation requires every member.
Use `.derive<Metadata>()(...entries)` for outputs sharing an object type.
Use `.deriveWith(callback)` for computed metadata and `.get(member)` for lookup;
derived tables are not callable.

## Compose related domains

Use `.pick([MEMBER, ...])`, `.omit([MEMBER, ...])`, and `.extend([...])` for
related domains. These methods do not take a display name. Do not duplicate value
lists. The published package bases identity on values rather than declaration names.
Use `.values` and `.enum` in application code. Reserve `.rawValues`,
`.rawEnum`, and `.cases` for integrations requiring unbranded values.
Use `createEnumwaiiQueryParser` from `enumwaii/nuqs` for nuqs integration.

## Enforce with lint

Rules are published separately as `eslint-plugin-enumwaii`.

```js
import enumwaiiPlugin from 'eslint-plugin-enumwaii';

export default [{
  plugins: { enumwaii: enumwaiiPlugin },
  rules: {
    'enumwaii/no-raw-enum-comparison': 'error',
    'enumwaii/no-raw-enum-member': 'error',
  },
}];
```

Both rules require TypeScript project services. Keep them enabled wherever enum
values are consumed. Do not disable lint to permit raw enum values.

## Database and transport

Values serialize as strings. Use the Zod adapter in oRPC input and output
contracts. Drizzle `.$type<T>()` preserves the branded application type but does
not validate stored data. Use a database enum or check constraint for durable
validation; parse legacy values in the resolver when necessary.

See the [published documentation](https://catofjupit3r.github.io/enumwaii/)
and [API reference](https://catofjupit3r.github.io/enumwaii/docs/api/enumwaii/).
