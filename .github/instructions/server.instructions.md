---
applyTo: "apps/server/**/*.ts,packages/shared/**/*.ts"
---

## Overview

- API lives in `apps/server` and runs on Bun with Hono, oRPC, and Better Auth on top of MongoDB (Mongoose via Typegoose).
- Contracts defined in `packages/shared` are the single source of truth for both RPC and REST/OpenAPI surfaces.
- The server exposes REST (OpenAPIHandler) alongside RPC (`/api/rpc`) and Better Auth routes under `/auth/*`.
- Logging defaults to Hono's `logger()` middleware; add structured logging only where it improves observability.

## Environment & Bootstrapping

- Start the stack with `bun run dev`; it launches the API at `http://localhost:3000` and MongoDB via `docker-compose.dev.yml`.
- Copy `.env.example` to `.env` inside `apps/server` and adjust values; `src/constants/env.ts` validates them with `zod` at boot.
- Default Mongo connection: `mongodb://localhost:6060/startername` with credentials `username/password`. Update the compose file if you change ports or users.
- The Better Auth server issues secure (`sameSite: 'none'`, `secure: true`) cookies; use HTTPS (or Chrome flags) when testing cross-origin.

## Contract-First Endpoint Flow

1. **Define/extend contracts in `packages/shared/src/contract`.**
    - Use `oc.route({ path, method })` with explicit `zod` input/output schemas.
    - Prefer shared schemas for reuse; authenticated routes should start from `authProcedure` to surface the `auth: "USER"` metadata.
    - Export new routers through `packages/shared/src/contract/index.ts` so `CONTRACT` stays complete.

2. **Implement router handlers in `apps/server/src/routers`.**
    - Mirror the contract namespace via `base.<namespace>.router({ ...handlers })`.
    - Choose `publicProcedure` or `protectedProcedure` from `@~/lib/orpc` based on contract metadata; protected handlers receive `context.session` with Better Auth user info.
    - **Error handling:** All error codes **must** be defined in `src/enums/errors.ts` with corresponding messages. Always throw errors using the custom wrappers from `@~/lib/orpc-error-wrapper` (`ORPCNotFoundError`, `ORPCBadRequestError`, `ORPCForbiddenError`, `ORPCUnauthorizedError`, etc.) to ensure consistent error responses.
    - **Access control:** Use `NOT_FOUND` when the user does not have any access to a resource to avoid leaking information about entity existence. Only use `FORBIDDEN` when the user might have access to the resource but lacks the required permissions (e.g., editing another user's challenge when editing is restricted to the creator).

3. **Register the router.**
    - Append the router to `appRouter` in `apps/server/src/routers/index.ts` so it is automatically exposed via both REST and RPC handlers.
    - Run `bun run check-types` to ensure contract/implementation parity.

4. **Extend context cautiously.**
    - `createContext` (`apps/server/src/lib/context.ts`) currently injects the Better Auth session. Add new context properties (e.g., loaders, feature flags) only if they are cheap to resolve per request.

## Error Handling & Access Control

- All error codes must be defined in `src/enums/errors.ts` with their corresponding messages. This centralizes error management and ensures consistency.
- Always use custom error wrappers from `@~/lib/orpc-error-wrapper.ts`:
  - `ORPCUnauthorizedError(code)` - User is not authenticated (e.g., accessing a protected route without a session).
  - `ORPCForbiddenError(code)` - User is authenticated but lacks sufficient permissions (e.g., trying to edit another user's resource when only creators can edit).
  - `ORPCNotFoundError(code)` - Resource not found **or** user has no access to it. Use `NOT_FOUND` to avoid leaking information about entity existence to unauthorized users.
  - `ORPCBadRequestError(code)` - Invalid input (e.g., malformed request, missing required fields).
  - `ORPCUnprocessableContentError(code)` - Valid input but semantically invalid (e.g., trying to join a challenge that is already completed).
  - `ORPCInternalServerError(code?)` - Server error; log the error and avoid exposing internal details to the client.

**Access Control Best Practices:**
- Use `NOT_FOUND` when a user cannot see or access a resource (e.g., viewing a private challenge without an invitation). This prevents information disclosure.
- Use `FORBIDDEN` only when the user has some level of access but is restricted by permissions (e.g., a community member trying to delete the community they don't own).
- Always check user permissions in the handler before performing mutations; return appropriate errors early.
- Example pattern:
  ```typescript
  const challenge = await ChallengeModel.findById(challengeId);
  if (!challenge || (challenge.visibility === 'PRIVATE' && challenge.creatorId !== userId)) {
    throw ORPCNotFoundError(errorCodes.CHALLENGE_NOT_FOUND);
  }
  if (challenge.creatorId !== userId) {
    throw ORPCForbiddenError(errorCodes.INSUFFICIENT_PERMISSIONS);
  }
  ```

## Typegoose Modeling Guidelines

- Models live in `apps/server/src/db/models` and use Typegoose to wrap Mongoose.
- Always prefer class-based schemas with `@modelOptions` and `@prop` decorators; the collection name should be set via `schemaOptions.collection`.
- Generate string `_id` values with `ObjectIdString()` (`apps/server/src/db/helpers.ts`) to stay consistent across documents and GraphQL-style clients.
- Index frequently queried fields with `@prop({ index: true })` and mark uniqueness where needed (e.g., invite codes, emails).
- Export both the model instance (`getModelForClass`) and the class type (`DocumentType`) when other modules need runtime and type-safe access.
- Example pattern:

    ```typescript
    import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
    import type { DocumentType } from "@typegoose/typegoose";
    import { ObjectIdString } from "../helpers";

    @modelOptions({ schemaOptions: { collection: "examples" } })
    class ExampleClass {
        @prop({ default: () => ObjectIdString() })
        public _id!: string;

        @prop({ required: true, index: true })
        public ownerId!: string;
    }

    export const ExampleModel = getModelForClass(ExampleClass);
    export type ExampleDoc = DocumentType<ExampleClass>;
    ```

- Use nested classes for embedded documents (see `communities.model.ts` for `UserInCommunityClass`) and share schema fragments when multiple collections embed the same structure.
- Keep business logic outside the model classes; prefer stateless services or router handlers for queries/mutations.

## Authentication & Sessions

- Better Auth is configured in `apps/server/src/lib/auth.ts` with the Mongo adapter; session lookups happen in `createContext`.
- The `/auth/*` route is mounted directly on Hono using `auth.handler`. Client code uses `better-auth/react` (`apps/web/src/services/auth-service.ts`).
- If you add lifecycle hooks (e.g., after user creation), wrap them in try/catch, log meaningful errors, and avoid throwing unless the request must fail.

## Server Architecture

### Feature-based design

Each feature lives in its own folder with all related logic:

apps/server/src/features/<domain>/
  ├── <domain>.model.ts       # Feature-specific models
  ├── <domain>.service.ts     # Business logic
  ├── <domain>.router.ts      # Routes/controllers
  ├── <domain>.hooks.ts       # Feature hooks
  ├── <domain>.helpers.ts     # Utilities
  └── <domain>.types.ts       # Types/contracts

### Shared / Global

Cross-feature logic lives in /:

```
apps/server/src/
  ├── base/                    # BaseService, BaseModel, abstract classes
  ├── services/                # Logger, EventBus, Config, Cache
  ├── helpers/                 # Utils (date, string, crypto, etc.)
  └── hooks/                   # Global hook registry
```

## Code Snippets & Patterns

### Query Optimization
```typescript
// Use indexes from models
// E.g., Challenge queries: creatorId, visibility, createdAt
const challenges = await ChallengeModel
  .find({ visibility: CHALLENGE_VISIBILITY.PUBLIC, archived: false })
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(offset);
```

### Dependency Injection (DI) patterns

This codebase uses tsyringe's container with a small wrapper in `apps/server/src/di`.
Follow these steps when adding or using services:

- Add a token to `apps/server/src/di/tokens.ts` (unique symbol + type in the registry).
- Export your service class (stateless where possible) and register it in `registerServices()` in `apps/server/src/di/container.ts`.
- Use the `resolve` helper or the `GETTERS` helper (`apps/server/src/routers/di-getter.ts`) from handlers to obtain instances.

Example — token + registry entry (from `tokens.ts`):
```typescript
// apps/server/src/di/tokens.ts (excerpt)
const myServiceToken: unique symbol = Symbol.for('MyService');

export const TOKENS = {
  // ...existing tokens
  MyService: myServiceToken,
} as const;

export interface iTokenRegistry {
  // ...existing entries
  [TOKENS.MyService]: MyService;
}
```

Example — register the service (in `container.ts`):
```typescript
// apps/server/src/di/container.ts (excerpt)
import { MyService } from '@~/features/my-feature/my-feature.service';
import { TOKENS } from './tokens';

export async function registerServices() {
  // ...other registrations
  container.registerSingleton(TOKENS.MyService, MyService);
}

// Resolve helper
export function resolve<T extends keyof iTokenRegistry>(token: T): iTokenRegistry[T] {
  return container.resolve<iTokenRegistry[T]>(token);
}
```

Example — using a service outside of classes:
```typescript
import { resolve } from '@~/di';
import { TOKENS } from '@~/di/tokens';

export const myHandler = async (ctx) => {
  const myService = resolve(TOKENS.MyService);
  const result = await myService.doSomething(ctx.request.body);
  return ctx.json(result);
}
```

Notes & patterns
- Prefer `registerSingleton` for shared infrastructure (database, event bus, logger factories).
- Use `container.register(..., { lifecycle: Lifecycle.Transient })` or `useClass` for services that must be created per usage (e.g., stateful short-lived objects).
- Keep services small, focused, and stateless where feasible. Push business logic into service methods rather than routers.
- For testability, prefer resolving tokens in tests (mock the container registration during test setup) or export a factory that accepts dependencies explicitly.

Quick checklist when adding a new service
1. Create the service class file under `apps/server/src/features/<feature>` and export it.
2. Add a token in `apps/server/src/di/tokens.ts` and add the type to `iTokenRegistry`.
3. Register the service in `registerServices()` in `apps/server/src/di/container.ts`.
4. Use `resolve(TOKENS.YourService)` or add a getter to `apps/server/src/routers/di-getter.ts` for common access.

### Constructor injection

While resolving services via `resolve(TOKENS.X)` is fine in handlers, prefer constructor injection for service-to-service wiring so dependencies are explicit and testable.

Example — inject one service into another using `tsyringe` decorators:

```typescript
import { injectable, inject } from 'tsyringe';
import { TOKENS } from '@~/di/tokens';

@injectable()
export class NotificationsService {
  constructor(
    @inject(TOKENS.UserService) private userService: UserService,
    @inject(TOKENS.LoggerFactory) private loggerFactory: LoggerFactory,
  ) {
    this.logger = this.loggerFactory.create('NotificationsService');
  }

  private readonly logger: ReturnType<LoggerFactory['create']>;

  public async notifyUser(userId: string, payload: NotificationPayload) {
    const user = await this.userService.findById(userId);
    if (!user) {
      this.logger.warn('Cannot notify non-existent user', { userId });
      return;
    }
    // ...send notification
    this.logger.info('User notified', { userId });
  }
}
```

Register `NotificationsService` in `registerServices()` with `container.registerSingleton(TOKENS.NotificationsService, NotificationsService)` and the container will inject dependencies automatically.

### Logger factory

The repo exposes a `LoggerFactory` token and implementation; register the factory as a singleton and use it inside services to create contextual loggers.

Example logger factory interface and usage pattern:

```ts
// In a service:
constructor(@inject(TOKENS.LoggerFactory) private loggerFactory: LoggerFactory) {
  this.logger = this.loggerFactory.create('MyService');
}

this.logger.info('started', { some: 'meta' });
```

Using a logger factory keeps logger creation consistent (same format, processors, and sinks) and avoids importing a global logger instance directly in feature code.


## Error Throwing
```typescript
// For access denial (hide resource existence):
throw ORPCNotFoundError(errorCodes.RESOURCE_NOT_FOUND);

// For permission denial (user has some access):
throw ORPCForbiddenError(errorCodes.INSUFFICIENT_PERMISSIONS);

// For bad input:
throw ORPCBadRequestError(errorCodes.INVALID_INPUT_VALUE);
```


## Local Quality Checks

- `bun run lint`: ESLint for backend + shared packages.
- `bun run check-types`: TypeScript project references (server + shared).
- `bun run dev`: hot reload API + Mongo container.
- Husky runs lint-staged on commit; re-run `bun run prepare` if the hooks go missing.
