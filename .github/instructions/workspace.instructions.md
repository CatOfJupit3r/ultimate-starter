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

### Monorepo Layout Highlights
- `apps/server`: API entry (`src/index.ts`), oRPC context/auth (`src/lib`), routers, loaders, and Mongoose models (`src/db`).
- `apps/web`: Vite app bootstrapped in `src/main.tsx`, TanStack Router tree, UI components, query hooks, and auth services.
- `packages/shared`: Source of truth for oRPC contracts (`src/contract`), exported via `CONTRACT` and consumed on both server and client.
- `docs`: Product requirements, risks, roadmap, and other high-level references.
- `mongo`: Local MongoDB volume used by docker-compose.dev.yml (avoid committing changes here).

### Environment and Configuration
- Copy `.env.example` to `.env` in `apps/server` and `apps/web`; server validates configuration with `zod` in `src/constants/env.ts`.
- The Better Auth server is mounted under `/auth/*` and expects HTTPS cookies (`sameSite: 'none'`, `secure: true`); keep this in mind when testing locally.
- Aliases: `@~/` resolves to `apps/server/src` or `apps/web/src` depending on the package; `@startername/shared` surfaces shared types.
- MongoDB runs at `mongodb://localhost:6060/startername` by default; adjust via env vars and update docker-compose if ports change.

## Specialized Guides
- Backend-specific processes: see `server.instructions.md` for contract extensions, router wiring, authentication context, and Typegoose modeling patterns.
- Frontend-specific workflows: see `web.instructions.md` for oRPC + TanStack usage, optimistic UI updates, and component/hook conventions.
