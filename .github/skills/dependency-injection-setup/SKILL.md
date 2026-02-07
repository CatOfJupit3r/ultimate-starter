---
name: dependency-injection-setup
description: Set up and use dependency injection with tsyringe for server-side services. Use when creating services, registering tokens, implementing service-to-service dependencies, using the logger factory pattern, or resolving services in handlers.
---

# Dependency Injection Setup

## Core concepts

This codebase uses tsyringe's container with a small wrapper in `apps/server/src/di`. Services are registered with tokens and resolved through a type-safe registry.

## Step-by-step procedure

### 1. Create the service class

Create your service in `apps/server/src/features/<feature>/<feature>.service.ts`.

**See [references/service-patterns.md](references/service-patterns.md) for complete service examples.**

```typescript
import { injectable } from 'tsyringe';

@injectable()
export class MyFeatureService {
  constructor() {
    // Constructor logic
  }

  public async doSomething(input: string): Promise<string> {
    // Business logic
    return `Processed: ${input}`;
  }
}
```

### 2. Add a token to the registry

Add the token and type to `apps/server/src/di/tokens.ts`:

```typescript
// Create a unique symbol
const myFeatureServiceToken: unique symbol = Symbol.for('MyFeatureService');

export const TOKENS = {
  // ...existing tokens
  MyFeatureService: myFeatureServiceToken,
} as const;

// Add type to registry
export interface iTokenRegistry {
  // ...existing entries
  [TOKENS.MyFeatureService]: MyFeatureService;
}
```

### 3. Register the service

Register in `apps/server/src/di/container.ts`:

```typescript
import { MyFeatureService } from '@~/features/my-feature/my-feature.service';
import { TOKENS } from './tokens';

export async function registerServices() {
  // ...other registrations
  
  // For stateless services (most cases)
  container.registerSingleton(TOKENS.MyFeatureService, MyFeatureService);
  
  // For stateful services that need per-usage instances
  container.register(TOKENS.MyFeatureService, MyFeatureService, {
    lifecycle: Lifecycle.Transient,
  });
}
```

### 4. Resolve and use the service

#### In handlers

```typescript
import { resolve } from '@~/di';
import { TOKENS } from '@~/di/tokens';

export const myHandler = async (input, context) => {
  const myService = resolve(TOKENS.MyFeatureService);
  const result = await myService.doSomething(input.value);
  return { result };
};
```

#### Create a getter for common access

Getters automatically pick-up new services added to the registry, providing a convenient way to access them without importing tokens and resolve in every handler.

```typescript
import { GETTERS } from '@~/routers/di-getter';

export const myHandler = async (input, context) => {
  const myService = GETTERS.myFeatureService();
  const result = await myService.doSomething(input.value);
  return { result };
};
```

## Constructor injection pattern

For service-to-service dependencies, use constructor injection with `@inject()`:

```typescript
import { injectable, inject } from 'tsyringe';
import { TOKENS } from '@~/di/tokens';
import type { iLogger } from '@~/di/tokens';

@injectable()
export class NotificationsService {
  private readonly logger: iLogger;

  constructor(
    @inject(TOKENS.UserService) private userService: UserService,
    @inject(TOKENS.LoggerFactory) loggerFactory: () => iLogger
  ) {
    this.logger = loggerFactory();
  }

  public async notifyUser(userId: string, message: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      this.logger.warn('Cannot notify non-existent user', { userId });
      return;
    }
    // Send notification
  }
}
```

## Service lifecycle

Choose the appropriate lifecycle when registering:

```typescript
// Singleton (default) - for stateless services
container.registerSingleton(TOKENS.MyService, MyService);

// Transient - for stateful services
container.register(TOKENS.MyService, MyService, {
  lifecycle: Lifecycle.Transient,
});
```

**See [references/advanced-patterns.md](references/advanced-patterns.md) for testing patterns, best practices, and advanced service patterns.**
