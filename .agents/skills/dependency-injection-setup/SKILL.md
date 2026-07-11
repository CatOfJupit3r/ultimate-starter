---
name: dependency-injection-setup
description: Set up and use dependency injection with tsyringe for server-side services. Use when creating services, implementing service-to-service dependencies, or using the logger factory pattern.
---

# Dependency Injection Setup

This codebase uses tsyringe with decorator-based auto-registration. Services are injected by class type using `@singleton()` or `@injectable()` decorators.

## Creating a Service

Create your service in `apps/server/src/features/<feature>/<feature>.service.ts`:

```typescript
import { singleton } from 'tsyringe';
import { LoggerFactory } from '@~/features/logger/logger.factory';
import type { iWithLogger } from '@~/features/logger/logger.types';

@singleton()
export class MyFeatureService implements iWithLogger {
  public readonly logger;

  constructor(loggerFactory: LoggerFactory) {
    this.logger = loggerFactory.create('my-feature-service');
  }

  public async doSomething(input: string): Promise<string> {
    this.logger.info('Processing input', { input });
    return `Processed: ${input}`;
  }
}
```

## Register the Service

Add the import to `apps/server/src/di/container.ts`:

```typescript
export async function registerServices() {
  // ... existing imports
  await import('@~/features/my-feature/my-feature.service');
}
```

## Using Services

### In Handlers

```typescript
import { container } from 'tsyringe';
import { MyFeatureService } from '@~/features/my-feature/my-feature.service';

export const myHandler = async (input, context) => {
  const service = container.resolve(MyFeatureService);
  return await service.doSomething(input.value);
};
```

### Constructor Injection

For service-to-service dependencies, inject via constructor:

```typescript
import { singleton } from 'tsyringe';
import { LoggerFactory } from '@~/features/logger/logger.factory';
import { UserService } from '@~/features/user/user.service';

@singleton()
export class NotificationService {
  public readonly logger;

  constructor(
    loggerFactory: LoggerFactory,
    private readonly userService: UserService,
  ) {
    this.logger = loggerFactory.create('notification-service');
  }

  public async notifyUser(userId: string, message: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      this.logger.warn('User not found', { userId });
      return;
    }
    // Send notification
  }
}
```

## Logger Pattern

Always inject `LoggerFactory` and create a contextual logger:

```typescript
constructor(loggerFactory: LoggerFactory) {
  this.logger = loggerFactory.create('service-name');
}
```

## Token-Based Injection (For Interfaces)

When injecting **interfaces** instead of concrete classes, use tokens:

### 1. Define the interface and token

```typescript
// my-feature.types.ts
export interface iPaymentService {
  processPayment(amount: number);
}

// Create token in apps/server/src/di/tokens.ts
export const PAYMENT_SERVICE_TOKEN = Symbol.for('PaymentService');
```

### 2. Register the implementation

```typescript
// In apps/server/src/di/container.ts
import { StripePaymentService } from '@~/features/payment/stripe-payment.service';
import { PAYMENT_SERVICE_TOKEN } from './tokens';

export async function registerServices() {
  // ... other imports
  
  // Register interface implementation
  container.registerSingleton<iPaymentService>(
    PAYMENT_SERVICE_TOKEN,
    StripePaymentService
  );
}
```

### 3. Inject with @inject() decorator

```typescript
import { singleton, inject } from 'tsyringe';
import { PAYMENT_SERVICE_TOKEN } from '@~/di/tokens';
import type { iPaymentService } from '@~/features/payment/payment.types';

@singleton()
export class CheckoutService {
  constructor(
    @inject(PAYMENT_SERVICE_TOKEN) private payment: iPaymentService,
    loggerFactory: LoggerFactory, // Still auto-injected
  ) {}
}
```

**When to use tokens:**
- Injecting interfaces with multiple implementations
- Swapping implementations for testing
- Plugin/strategy patterns

**When NOT to use tokens:**
- Injecting concrete classes (use direct injection instead)

## Service Lifecycle

- Use `@singleton()` for stateless services (default, recommended)
- Use `@injectable()` with transient lifecycle for stateful services (rare)
