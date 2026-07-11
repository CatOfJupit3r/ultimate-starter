---
name: drizzle-orm
description: Design PostgreSQL schemas, migrations, and typed repository queries with Drizzle ORM.
---

# Drizzle ORM

Use Drizzle schemas under `apps/server/src/db/schema/` as the source of truth for PostgreSQL tables, indexes, foreign keys, and inferred row types.

- Keep database access behind feature repositories rather than importing tables throughout handlers.
- Use `drizzle-kit generate` for migrations and commit both the SQL file and migration metadata.
- Use `POSTGRES_URL` for the runtime database connection.
- Use the PGlite test helper to apply committed migrations and isolate integration tests with `TRUNCATE ... CASCADE`.
- Keep Better Auth's `users`, `sessions`, `accounts`, and `verifications` schemas in sync with `@better-auth/drizzle-adapter`.

## Deriving repository response types

Don't hand-write repository response interfaces field-by-field — derive them from `typeof table.$inferSelect` so schema changes propagate automatically. Only override the fields that actually differ (e.g. nullable columns exposed as optional):

```typescript
// apps/server/src/features/<feature>/<feature>.types.ts
import type { someTable } from '@~/db/schema';

type SomeRow = typeof someTable.$inferSelect;

export type iSomeRecordResponse = Omit<SomeRow, 'nullableColumn'> & {
  nullableColumn?: string;
};
```

Do not add a `export type SomeRecordResponse = iSomeRecordResponse` alias — import and use `iSomeRecordResponse` directly.

## Resolvers: turning rows into responses without boilerplate

Don't hand-write a `toResponse(row)` function that copies every field one by one — most of that copying is one of three mechanical operations: pass a field through untouched, turn a nullable column into an optional field (`value ?? undefined`), or drop a column that isn't exposed in the API. Use `createRowResolver` from `@~/lib/row-resolver` to express those declaratively, and group a feature's resolvers in a `<feature>.resolver.ts` file as a `@singleton()` class (mirrors a GraphQL resolver map, and keeps every response-shaping function for a feature in one place). Resolvers are dependency-injected like repositories — not static classes — so they compose with tsyringe the same way `PostgresService` does:

```typescript
// apps/server/src/features/<feature>/<feature>.resolver.ts
import { singleton } from 'tsyringe';

import type { someTable } from '@~/db/schema';
import { createRowResolver } from '@~/lib/row-resolver';

import type { iSomeRecordResponse } from './<feature>.types';

type SomeRow = typeof someTable.$inferSelect;

@singleton()
export class SomeResolver {
  public toSomeResponse = createRowResolver<SomeRow, iSomeRecordResponse>({
    optional: ['nullableColumn'], // null -> undefined
    omit: ['internalColumn'], // dropped entirely, not in iSomeRecordResponse
    overrides: (row) => ({ someId: row.someId as SomeNarrowedId }), // anything else
  });
}
```

Repositories take the resolver as a constructor dependency and call `this.someResolver.toResponse(row)`:

```typescript
@singleton()
export class DrizzleSomeRepository implements iSomeRepository {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly someResolver: SomeResolver,
  ) {}
  // ...
}
```

See `apps/server/src/features/auth/auth-user.resolver.ts`, `apps/server/src/features/achievements/user-achievement.resolver.ts`, and `apps/server/src/features/user/user-profile.resolver.ts` for real examples.
