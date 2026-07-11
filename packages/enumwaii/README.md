# @startername/enumwaii

Enum library for this starter. Goal: make magic strings impossible to sneak past the compiler, and make invalid values crash at runtime boundaries, while staying trivially serializable.

See [docs/reference/enumwaii-guide.md](../../docs/reference/enumwaii-guide.md) for the full usage guide and migration recipe from the `z.enum` convention.

## Shape

```ts
import { Enumwaii, type InferEnumwaii } from '@startername/enumwaii/enumwaii';

const userRolesEnumwaii = new Enumwaii('UserRole', ['ADMIN', 'USER', 'GUEST']);

export const USER_ROLES = userRolesEnumwaii.enum;
export type UserRole = InferEnumwaii<typeof userRolesEnumwaii>;
export const userRoleSchema = userRolesEnumwaii.schema;
```

Use `new Enumwaii(...)` for declarations. The constructor preserves literal inference directly. Every accessor is an arrow-function field, so they can be passed around detached: `values.filter(userRolesEnumwaii.is)`.

## What each concern maps to

| Concern                        | Mechanism                                                                                                                                                                                                                                                                                                               |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Magic strings in code          | `UserRole` is a branded string type. `acceptRole('ADMIN')` is a compile error; `acceptRole(USER_ROLES.ADMIN)` compiles.                                                                                                                                                                                                 |
| Runtime crashes on bad strings | `parse` / `asSchema().parse` throw `EnumwaiiParseError` on invalid input. Reading a nonexistent member (`USER_ROLES.ADMNI` in untyped code) throws `EnumwaiiUnknownMemberError` via a Proxy guard instead of returning `undefined`.                                                                                     |
| Serialization                  | Branded values ARE plain strings at runtime; `JSON.stringify` just works. `serialize` is an identity that unbrands the type at explicit boundaries.                                                                                                                                                                     |
| Deserialization                | `parse` (throws), `safeParse` (result object), `is` (type guard) promote untrusted strings back to branded values.                                                                                                                                                                                                      |
| Zod interop                    | `schema` is a `z.ZodType` whose output is the branded type, so oRPC contracts and forms produce branded values directly. `asSchema()` remains as a method alias for callback-oriented code.                                                                                                                             |
| Supersets                      | `base.extend('Name', ['NEW'])` — values of the base enum remain assignable to the extended type.                                                                                                                                                                                                                        |
| Partial enums                  | `base.pick('Name', [MEMBERS.A, MEMBERS.B])` / `base.omit('Name', [MEMBERS.C])` produce runtime subsets while retaining the parent type.                                                                                                                                                                                 |
| Derived lookup tables          | `base.derive({ [MEMBERS.A]: ... })` validates missing and unknown members at runtime. `no-raw-enum-member` requires computed member keys. Returns a callable table: `MODE_LABELS(mode)` is the typed lookup (`.get` is an alias), `.record` is a frozen plain-keyed object for iteration whose unknown-key reads throw. |
| Raw `===` comparisons          | Cannot be blocked by types (see below); the package ships a type-aware ESLint rule, `no-raw-enum-comparison`, that flags `role === 'ADMIN'` and raw `switch` cases against enumwaii values.                                                                                                                             |

## The derived-record problem

The motivating case: agents writing `{ PLAN: '...' }` instead of `[MODES.PLAN]: '...'` in `satisfies Record<Mode, string>` maps. With `derive`, the key spelling stops mattering because the function itself is the guarantee:

```ts
const MODE_DESCRIPTIONS = modesEnumwaii.derive({
  [MODES.PLAN]: 'Turn a broad story goal into proposed arcs...',
  [MODES.EXECUTE]: 'Carry out an approved story action...',
});

MODE_DESCRIPTIONS(mode); // callable lookup, per-key result types preserved
MODE_DESCRIPTIONS.get(mode); // alias, for passing the lookup around
MODE_DESCRIPTIONS.record; // frozen plain-keyed object for iteration/interop
```

The table is callable because true bracket indexing (`MODE_DESCRIPTIONS[mode]`) is unreachable: TypeScript rejects element access with a branded string no matter how the record's keys are typed (verified against plain-keyed, branded-keyed, and intersection shapes under tsgo). `TABLE(mode)` is the closest ergonomic equivalent.

Computed `[MODES.PLAN]` keys are the required style. TypeScript widens such maps to a string index signature, so `derive` checks completeness at runtime and `no-raw-enum-member` prevents raw keys at lint time.

## Known tradeoffs

- **Identity comes from the enum name literal.** Unrelated enums with overlapping values are not assignable. `pick`, `omit`, and `extend` preserve the base identity so subsets and supersets still compose. Independently declaring two enums with the exact same name intentionally gives them the same identity, so enum names must be unique.
- **Comparison with raw strings cannot be blocked by types.** `role === 'ADMIN'` compiles because branded is a subtype of the literal — and probing showed that even a `string & { [brand]: 'ADMIN' }` shape (no literal subtype) stays comparable under TypeScript's comparability relation, while also destroying narrowing. The workable fix is lint, not types: the package ships `no-raw-enum-comparison` (see below).
- **Equality narrowing is partial.** `if (role === ROLES.ADMIN)` narrows the true branch, and `switch` cases narrow per-case, but false branches and exhaustive `default: never` checks do not collapse the union, because branded members are not unit types. Use `default:` fallbacks rather than `never` exhaustiveness checks.
- **Branded values cannot bracket-index records.** TypeScript rejects `record[brandedValue]` (`T[Literal & Brand]` is an implicit-any error, even against branded-keyed mapped types — verified under tsgo). This is why derived tables expose `get()` instead of being plain objects. A native TS `enum` would not have this problem, but it is banned in this codebase and cannot be created dynamically.
- **Proxy guards are hostile to structural probing.** Deep-equality libraries or serializers that read speculative properties off `enum` or derived records will throw. Iteration, spread, `Object.keys`, and `JSON.stringify` are safe; symbol lookups, prototype members, `toJSON`, and `then` pass through.
- **`schema` hides the `ZodEnum` class.** The type is a plain `z.ZodType`, so zod-enum-specific introspection (`.enum`, `.options`) is not surfaced. Use `rawValues` for that.

## The `no-raw-enum-comparison` ESLint rule

Type-aware rule that closes the `role === 'ADMIN'` hole. It flags `==`/`===`/`!=`/`!==` where one side is an enumwaii-branded value and the other is a raw string literal, and raw string `case`s in a `switch` over an enumwaii value. Comparisons against enum members (`role === ROLES.ADMIN`) and plain-string comparisons pass.

Wire it into a flat config (requires type-aware linting, i.e. `projectService`):

```js
import { noRawEnumComparisonRule } from '@startername/enumwaii/eslint-rules/no-raw-enum-comparison';

export default [
  {
    plugins: { enumwaii: { rules: { 'no-raw-enum-comparison': noRawEnumComparisonRule } } },
    rules: { 'enumwaii/no-raw-enum-comparison': 'error' },
  },
];
```

Detection matches the brand's unique-symbol property name (`ENUMWAII_BRAND`) on the operand's type, so it works across unions and any file the value flows through. See `test/fixtures/raw-comparison.fixture.ts` for what is and is not flagged.
