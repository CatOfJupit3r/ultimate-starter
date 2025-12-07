---
applyTo: '**/*.ts'
---

## Guidelines, Structure, and Purpose
- This file outlines the overall workspace structure, development guidelines, and key conventions for contributors to the monorepo
- The repo is a Turborepo monorepo managed with Bun (`packageManager` pinned at 1.2.21) and Docker-backed MongoDB; `bun run dev` boots both the API (http://localhost:3000) and web app (http://localhost:3001).
- Backend code uses TypeScript + Hono + oRPC on top of MongoDB via Mongoose; shared contracts live in packages/shared and drive both REST/OpenAPI and RPC layers.
- Frontend code is React 19 with Vite, TanStack Router/Query/Form, Tailwind, Sonner, and the Better Auth client; shared types come from packages/shared.
- Quality gates run locally via `bun run check-types`, `bun run lint`, and `bun run prettier`; Husky hooks (installed by `bun run prepare`) enforce these before commits.
- Follow the workspace workflow: open an issue, branch as `<issue>-<slug>`, commit with `git cz` (or `bun commit`), keep Docker running for seeded Mongo, and avoid rebases on main.
- For specialized guides, see `server.instructions.md` for backend patterns and `web.instructions.md` for frontend conventions.

### Monorepo Layout Highlights
- `apps/server`: API entry (`src/index.ts`), oRPC context/auth (`src/lib`), routers, loaders, and Mongoose models (`src/db`).
- `apps/web`: Vite app bootstrapped in `src/main.tsx`, TanStack Router tree, UI components, query hooks, and auth services.
- `packages/shared`: Source of truth for oRPC contracts (`src/contract`), exported via `CONTRACT` and consumed on both server and client.
- `docs`: Product requirements, risks, roadmap, and other high-level references.
- `mongo`: Local MongoDB volume used by docker-compose.dev.yml (avoid committing changes here).

### Code Style and Conventions
- Follow standard TypeScript conventions with strict typing, `async/await`, and modular design. Avoid using `enum`, prefer `as const` objects.
- Always name files with kebab-case, interfaces with `i` prefix.
- In 90% of cases use `z.enum` instead of plain `as const` objects to create enums. Example:
  ```typescript
  import z from "zod";

  export const userRolesSchema = z.enum(["ADMIN", "USER", "GUEST"]);
  export const USER_ROLES = userRolesSchema.enum;
  export type UserRole = z.infer<typeof userRolesSchema>;
  ```
- If your variable is reused across server and client, define it in `packages/shared/src/constants` and import it from `@startername/shared/constants`. Only do this for non-sensitive data.
- When resolving warnings or errors, prefer addressing the root cause instead of using `// @ts-ignore` or `as unknown as <Type>`. Use these only as a last resort with a comment explaining why.
- If you encounter eslint warnings, run `bun run lint` to fix them in the file.
- When referencing values, that have enum, ALWAYS use the enum itself instead of hardcoding strings. Example:
  ```typescript
  // GOOD
  if (user.role === USER_ROLES.ADMIN) { ... }
  const SOME_OTHER_ENUM = {
    [VALUES.VALUE_ONE]: USER_ROLES.ADMIN,
    [VALUES.VALUE_TWO]: USER_ROLES.USER,
  }

  // BAD
  if (user.role === "ADMIN") { ... } // prone to typos and harder refactors
  const SOME_OTHER_ENUM = {
    VALUE_ONE: "ADMIN",
    VALUE_TWO: "USER",
  }
  ```
- Use `satisfies` clauses to ensure object shapes without losing type inference. Example:
  ```typescript
  const EXAMPLE_MAP = {
    keyOne: { label: "One", value: 1 },
    keyTwo: { label: "Two", value: 2 },
  } satisfies Record<string, { label: string; value: number }>;
  ```
- use conventional commit messages.

### Environment and Configuration
- Copy `.env.example` to `.env` in `apps/server` and `apps/web`; server validates configuration with `zod` in `src/constants/env.ts`.
- The Better Auth server is mounted under `/auth/*` and expects HTTPS cookies (`sameSite: 'none'`, `secure: true`); keep this in mind when testing locally.
- Aliases: `@~/` resolves to `apps/server/src` or `apps/web/src` depending on the package; `@startername/shared` surfaces shared types.
- MongoDB runs at `mongodb://localhost:6060/startername` by default; adjust via env vars and update docker-compose if ports change.

### Structure and Patterns

Our repository is organized to promote clarity, maintainability, and scalability. We use a feature-based structure for both backend and frontend code, ensuring that related files are grouped together.

#### Contracts

Shared API contracts:
```
packages/shared/src/contract/*.contract.ts
```

#### Legacy / Global

```
Models: apps/server/src/db/models/*.model.ts
Routers: apps/server/src/routers/*.router.ts
Error Handling: apps/server/src/lib/orpc-error-wrapper.ts
Error Codes: packages/shared/src/enums/errors.ts
```

#### Tests

Mirror the feature structure:

```
apps/<workspace>/test/
  ├── features/<feature>/<feature>.service.test.ts
  ├── integration/
  └── utils/
```

### Product Context

TODO: Replace this with actual product documentation later.

## Specialized Guides
- Backend-specific processes: see `server.instructions.md` for contract extensions, router wiring, authentication context, and Typegoose modeling patterns.
- Frontend-specific workflows: see `web.instructions.md` for oRPC + TanStack usage, optimistic UI updates, and component/hook conventions.
