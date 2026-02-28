---
name: dependency-injection-setup
description: Set up and use dependency injection with tsyringe for server-side services. Use when creating services, implementing service-to-service dependencies, using the logger factory pattern, or resolving services in handlers.
---

# Dependency Injection Setup

## Core concepts

This codebase uses tsyringe for dependency injection with `emitDecoratorMetadata` enabled (via SWC). This allows tsyringe to automatically infer constructor dependencies from their types - no tokens required for concrete classes.

**Key principle:** Inject classes directly. Only use tokens for interface-based injection patterns.

## Step-by-step procedure

### 1. Create the service class

Create your service in `apps/server/src/features/<feature>/<feature>.service.ts`.

**See [references/service-patterns.md](references/service-patterns.md) for complete service examples.**

```typescript
import { singleton } from 'tsyringe';

@singleton()
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

### 2. Register the service (usually automatic)

Classes decorated with `@singleton()` are automatically registered when imported. For most services, no explicit registration is needed.

If you need explicit registration (e.g., for transient lifecycle), add to `apps/server/src/di/container.ts`:

```typescript
export async function registerServices() {
  // Import the service (triggers @singleton() registration)
  await import('@~/features/my-feature/my-feature.service');
  
  // For transient services (new instance per resolution):
  const { MyFeatureService } = await import('@~/features/my-feature/my-feature.service');
  container.register(MyFeatureService, { useClass: MyFeatureService }, { lifecycle: Lifecycle.Transient });
}
```

### 3. Add a getter for router access

Add to `apps/server/src/routers/di-getter.ts`:

```typescript
import { MyFeatureService } from '@~/features/my-feature/my-feature.service';

export const GETTERS = {
  // ...existing getters
  MyFeatureService: () => container.resolve(MyFeatureService),
} as const;
```

### 4. Resolve and use the service

#### In handlers (via GETTERS)

```typescript
import { GETTERS } from '@~/routers/di-getter';

export const myHandler = async (input, context) => {
  const myService = GETTERS.MyFeatureService();
  const result = await myService.doSomething(input.value);
  return { result };
};
```

#### Direct resolution (in loaders/middleware)

```typescript
import { container } from 'tsyringe';
import { MyFeatureService } from '@~/features/my-feature/my-feature.service';

const myService = container.resolve(MyFeatureService);
```

## Constructor injection pattern

For service-to-service dependencies, tsyringe automatically resolves from parameter types:

```typescript
import { singleton } from 'tsyringe';
import { UserService } from '@~/features/user/user.service';
import { LoggerFactory } from '@~/features/logger/logger.factory';
import type { iWithLogger } from '@~/features/logger/logger.types';

@singleton()
export class NotificationsService implements iWithLogger {
  public readonly logger: iWithLogger['logger'];

  constructor(
    private readonly userService: UserService,  // Auto-resolved from type
    loggerFactory: LoggerFactory,               // Auto-resolved from type
  ) {
    this.logger = loggerFactory.create('notifications');
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

Choose the appropriate decorator or registration:

```typescript
// Singleton (most common) - single instance shared across app
@singleton()
export class MyService { ... }

// Injectable - must be explicitly registered with lifecycle
@injectable()
export class StatefulService { ... }

// Register as transient in container.ts:
container.register(StatefulService, { useClass: StatefulService }, { lifecycle: Lifecycle.Transient });
```

## When to use tokens (rare)

Only use tokens for interface-based injection. See `apps/server/src/di/tokens.ts` for documentation.

```typescript
// Define token for interface
export const PAYMENT_SERVICE_TOKEN = Symbol.for('PaymentService');

// Register implementation
container.registerSingleton<iPaymentService>(PAYMENT_SERVICE_TOKEN, StripePaymentService);

// Inject via @inject decorator
constructor(@inject(PAYMENT_SERVICE_TOKEN) private payment: iPaymentService) {}
```

**See [references/advanced-patterns.md](references/advanced-patterns.md) for testing patterns, best practices, and advanced service patterns.**
