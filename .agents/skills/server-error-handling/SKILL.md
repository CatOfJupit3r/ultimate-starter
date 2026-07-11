---
name: server-error-handling
description: Handle request, service, and transport errors with the repository's typed ORPC wrappers, unexpected-error boundary, metadata-aware logging, invariant helpers, and tryCatch patterns. Use when implementing access control, validation, retries, error mapping, or server error observability.
---

## Core principle

Request-facing errors must use custom error wrappers from `apps/server/src/lib/orpc-error-wrapper.ts` with error codes from `packages/common/src/enums/errors.enums.ts`. Never throw raw errors from request-facing business logic or use undefined error codes. Internal invariant failures may use `UnexpectedServerError`; the oRPC procedure boundary normalizes them before they reach a client.

Error wrappers accept typed error codes and optional additional data:
```typescript
function errorWrapper(code: ErrorCodesType, additionalData?: Record<string, unknown>, options?: iORPCErrorHandlingOptions)
```

## Error wrapper types

### ORPCUnauthorizedError
**When to use**: User is not authenticated

```typescript
import { ORPCUnauthorizedError } from '@~/lib/orpc-error-wrapper';
import { errorCodes } from '@startername/shared';

if (!context.session) {
  throw ORPCUnauthorizedError(errorCodes.UNAUTHORIZED);
}
```

### ORPCNotFoundError
**When to use**: Resource not found OR user has no access to it

This prevents information leakage by not revealing whether a resource exists when the user shouldn't see it.

```typescript
import { ORPCNotFoundError } from '@~/lib/orpc-error-wrapper';
import { errorCodes } from '@startername/shared';

// VISIBILITIES, USER_ROLES, and COMMUNITY_MEMBER_ROLES are imported enumwaii accessors.
const challenge = await ChallengeModel.findById(challengeId);
if (!challenge || (challenge.visibility === VISIBILITIES.PRIVATE && challenge.creatorId !== userId)) {
  throw ORPCNotFoundError(errorCodes.CHALLENGE_NOT_FOUND);
}
```

### ORPCForbiddenError
**When to use**: User is authenticated and can see the resource, but lacks sufficient permissions

Only use when the user has some level of access but is restricted by permissions.

```typescript
import { ORPCForbiddenError } from '@~/lib/orpc-error-wrapper';
import { errorCodes } from '@startername/shared';

const community = await CommunityModel.findById(communityId);
if (!community) {
  throw ORPCNotFoundError(errorCodes.COMMUNITY_NOT_FOUND);
}

// User can see the community but can't delete it
if (community.ownerId !== userId) {
  throw ORPCForbiddenError(errorCodes.INSUFFICIENT_PERMISSIONS);
}
```

### ORPCBadRequestError
**When to use**: Invalid input format or malformed request

```typescript
import { ORPCBadRequestError } from '@~/lib/orpc-error-wrapper';
import { errorCodes } from '@startername/shared';

if (!isValidEmail(email)) {
  throw ORPCBadRequestError(errorCodes.INVALID_EMAIL_FORMAT);
}
```

### ORPCUnprocessableContentError
**When to use**: Valid input but semantically invalid operation

```typescript
import { ORPCUnprocessableContentError } from '@~/lib/orpc-error-wrapper';
import { errorCodes } from '@startername/shared';

const challenge = await ChallengeModel.findById(challengeId);
if (challenge.isCompleted) {
  throw ORPCUnprocessableContentError(errorCodes.CHALLENGE_ALREADY_COMPLETED);
}
```

### ORPCInternalServerError
**When to use**: Unexpected server errors

```typescript
import { ORPCInternalServerError } from '@~/lib/orpc-error-wrapper';

try {
  await someOperation();
} catch (error) {
  logger.error('Operation failed', { error });
  throw ORPCInternalServerError();
}
```

Note: `ORPCInternalServerError` accepts an **optional** error code (unlike other wrappers). Use without code for truly unexpected errors, or with a code for expected error scenarios.

```typescript
// Optional error code:
throw ORPCInternalServerError(errorCodes.PUBLIC_CODE_GENERATION_FAILED);
```

## Access control patterns

### Pattern 1: Public vs Private resources

```typescript
const resource = await ResourceModel.findById(id);

// NOT_FOUND for both "doesn't exist" and "no access"
if (!resource || (resource.visibility === VISIBILITIES.PRIVATE && resource.ownerId !== userId)) {
  throw ORPCNotFoundError(errorCodes.RESOURCE_NOT_FOUND);
}

// User can see it; now check permissions
if (resource.ownerId !== userId) {
  throw ORPCForbiddenError(errorCodes.INSUFFICIENT_PERMISSIONS);
}
```

### Pattern 2: Role-based access

```typescript
const user = await UserModel.findById(userId);
const resource = await ResourceModel.findById(resourceId);

if (!resource) {
  throw ORPCNotFoundError(errorCodes.RESOURCE_NOT_FOUND);
}

// Check if user has required role
if (user.role !== USER_ROLES.ADMIN && resource.ownerId !== userId) {
  throw ORPCForbiddenError(errorCodes.INSUFFICIENT_PERMISSIONS);
}
```

### Pattern 3: Community membership

```typescript
const community = await CommunityModel.findById(communityId);
if (!community) {
  throw ORPCNotFoundError(errorCodes.COMMUNITY_NOT_FOUND);
}

const member = community.members.find((m) => m.userId === userId);

// Not a member - hide existence
if (!member) {
  throw ORPCNotFoundError(errorCodes.COMMUNITY_NOT_FOUND);
}

// Member but wrong role
if (member.role !== COMMUNITY_MEMBER_ROLES.ADMIN) {
  throw ORPCForbiddenError(errorCodes.INSUFFICIENT_PERMISSIONS);
}
```

## Adding new error codes

### 1. Define the error in enums

Add to `packages/shared/src/enums/errors.enums.ts`. The codes and messages are automatically generated from the `errors` enum object, so just add a new key-value pair:

```typescript
const myFeatureErrors = {
  MY_NEW_ERROR: 'Clear, user-friendly error message',
  ANOTHER_ERROR: 'Another descriptive message',
} as const;

const allErrors = {
  ...userErrors,
  ...myFeatureErrors,
  // ...other categories
} as const;
```

### 2. Use the error code in your handler/service

```typescript
import { errorCodes } from '@startername/shared';
import { ORPCBadRequestError } from '@~/lib/orpc-error-wrapper';

if (someCondition) {
  throw ORPCBadRequestError(errorCodes.MY_NEW_ERROR);
}
```

### 3. Type safety

The pattern ensures full type safety:
- `errorCodes` keys are typed as `ErrorCodesType`
- Messages are automatically looked up in `errorMessages`
- IDE autocomplete works for all codes

## Decision guide

```
User authenticated? → No → ORPCUnauthorizedError
              ↓
            Yes
              ↓
Resource exists? → No → ORPCNotFoundError
              ↓
            Yes
              ↓
User can see it? → No → ORPCNotFoundError (prevent info leak)
              ↓
            Yes
              ↓
Has permissions? → No → ORPCForbiddenError
              ↓
            Yes → Proceed
```

## Common mistakes

**Don't reveal resource existence**: Use `NOT_FOUND` for both "doesn't exist" and "user can't access" cases to prevent information leakage.

**Always use error codes**: Never expose raw errors or use undefined error codes. All codes must be defined in `packages/common/src/enums/errors.enums.ts`.

**Use enumwaii for closed-set decisions**: Import the owning `Enumwaii` accessor and compare against members such as `USER_ROLES.ADMIN`. Never introduce raw role/status/visibility strings, duplicate unions, or ad-hoc maps. Validate untrusted values with the enumwaii `.schema`, `.parse`, `.safeParse`, or `.is` before making an access-control decision.

## Advanced error utilities

`apps/server/src/lib/orpc-error-wrapper.ts` also provides metadata-aware factories and boundary helpers.

### Metadata and logging

The optional `iORPCErrorHandlingOptions` supports:

- `kind`: use `ORPC_ERROR_KINDS.INFO` for expected client/domain errors or `ORPC_ERROR_KINDS.UNEXPECTED` for failures that require logging.
- `operation`: a stable operation name used by transport logs.
- `context`: safe structured context for logs.
- `cause`: the original error through standard `ErrorOptions`.

Use `getORPCErrorMetadata`, `isORPCError`, and `shouldLogORPCError` for transport logging and diagnostics. `apps/server/src/loaders/hono.loader.ts` already logs unexpected failures with operation, transport, pathname, and safe context. Expected authorization, validation, not-found, and domain-state errors should remain quiet.

The available factories are `ORPCUnauthorizedError`, `ORPCNotFoundError`, `ORPCForbiddenError`, `ORPCBadRequestError`, `ORPCUnprocessableContentError`, `ORPCTooManyRequestsError`, and `ORPCInternalServerError`. Factories accept `(code, additionalData?, options?)`, except `ORPCInternalServerError`, whose code is optional. Never include stack traces, database errors, secrets, or provider responses in `additionalData`.

### Normalizing unexpected failures

`apps/server/src/lib/orpc.ts` applies an `unexpectedErrorBoundary` to every public procedure. It calls `rethrowUnexpectedError`, which preserves existing ORPC errors and converts unknown errors to `INTERNAL_SERVER_ERROR` with the original cause and `UNEXPECTED` metadata. Do not add broad, repetitive `try-catch` blocks to every router just to perform this conversion.

Use `handleUnexpectedError` when one whole operation has one unexpected-error policy:

```typescript
return handleUnexpectedError(
  () => provider.generate(input),
  { operation: 'story.generateNarrative', context: { providerId } },
);
```

Use `handleError` when a custom callback must translate every failure. Use `rethrowUnexpectedError` at a narrower boundary when the catch block needs to add operation-specific context. Both helpers preserve expected ORPC errors.

Use `expectDefined` for internal invariants such as a database `returning()` row that must exist after a successful write. It throws `UnexpectedServerError`, which the procedure boundary safely converts. Do not use it for request validation or authorization.

### Choosing `tryCatch` versus a catch block

Use `tryCatch` and the generic `handleError` from `@startername/common/helpers/error-handling.helper` for framework-neutral error flow. `tryCatch` provides Go-like `{ data, error }` branching when the caller needs to inspect the error and continue, return a fallback, record a metric, or perform cleanup. It is appropriate for adapters such as Valkey operations and optional context reads.

Prefer `handleUnexpectedError` or the procedure boundary when the operation should simply fail the request. Keep a local `try-catch` only when the catch has meaningful control flow, such as retrying a unique-key collision or translating one known external error while allowing other errors to be normalized. Do not use `tryCatch` and then immediately throw a generic error without inspecting its result.

### Boundary decision guide

```text
Expected client/domain condition -> ORPC_*Error(code)
Internal invariant               -> expectDefined(value, message)
One operation, one error policy  -> handleUnexpectedError(operation, options)
Need custom conversion callback  -> handleError(operation, onError)
Need to branch and continue      -> tryCatch(operation)
Unknown error at a boundary      -> rethrowUnexpectedError(error, options)
```
