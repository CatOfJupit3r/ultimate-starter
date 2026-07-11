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
