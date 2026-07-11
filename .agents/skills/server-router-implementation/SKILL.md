---
name: server-router-implementation
description: Implement oRPC router handlers on the server following contract definitions. Use when implementing API endpoints, connecting contracts to business logic, handling authenticated routes, registering new routers, or implementing business logic in handlers.
---

## Key rules

1. Router should ONLY call a service to do the business logic. It can shape the response, but should not contain business logic itself.
2. Use the contract to validate input and output. Do not validate manually in the handler.

## Step-by-step procedure

### 1. Create the router file

Create a new file in `apps/server/src/routers/<namespace>.router.ts`.

Basic structure:

```typescript
import { publicProcedure, protectedProcedure } from '@~/lib/orpc';
import { base } from './base';
import { myNamespaceContract } from '@startername/shared/contract';
import { resolve } from '@~/di';
import { TOKENS } from '@~/di/tokens';

export const myNamespaceRouter = base.myNamespace.router({
  myPublicProcedure: publicProcedure
    .use(myNamespaceContract.myPublicProcedure)
    .handler(async ({ input, context }) => {
      // Public handler - no authentication required
      const someService = container.resolve(SomeService);

      const result = await processData(input);
      return { result };
    }),

  myProtectedProcedure: protectedProcedure
    .use(myNamespaceContract.myProtectedProcedure)
    .handler(async ({ input, context }) => {
      // Protected handler - context.session contains user info
      const userId = context.session.user.id;
      const someService = container.resolve(SomeService);
      const result = await someService.processForUser(input, userId);
      return { result };
    }),
});
```

### 2. Choose the right procedure type

#### Public procedure

Use for endpoints that don't require authentication:

```typescript
publicProcedure
  .use(contract.listPublicChallenges)
  .handler(async ({ input }) => {
    const challengesService = container.resolve(ChallengesService);
    const challenges = await challengesService.listPublicChallenges(input);
    return { challenges };
  });
```

#### Protected procedure

Use for endpoints that require authentication. Access user info via `context.session`:

```typescript
import { errorCodes } from '@startername/shared';
import { ORPCNotFoundError } from '@~/lib/orpc-error-wrapper';
import { UserProfileService } from '@~/features/user-profile/user-profile.service';
import { container } from '@~/di';

protectedProcedure
  .use(contract.getUserProfile)
  .handler(async ({ input, context }) => {
    const userId = context.session.user.id;
    const userProfileService = container.resolve(UserProfileService);
    const profile = await userProfileService.getProfileByUserId(userId);

    return profile;
  });
```

### 3. Use services via dependency injection

Resolve services using `container.resolve` or `GETTERS`:

```typescript
import { container } from '@~/di';
import { TOKENS } from '@~/di/tokens';
import { NotificationService } from '@~/features/notifications/notification.service';

protectedProcedure
  .use(contract.notifyUser)
  .handler(async ({ input, context }) => {
    // Using container
    const notificationService = container.resolve(NotificationService);
    await notificationService.send(input.userId, input.message);
    
    // Using TOKENS if the service is generic interface
    const emailService = container.resolve(TOKENS.EmailService);
    await emailService.sendEmail(input.email, input.subject);
    
    return { success: true };
  });
```
### 4. Register the router

Add your router to `apps/server/src/routers/index.ts`:

```typescript
import { myNamespaceRouter } from './my-namespace.router';

export const appRouter = oc.router({
  // ...existing routers
  myNamespace: myNamespaceRouter,
});
```

