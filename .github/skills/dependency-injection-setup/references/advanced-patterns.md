# Advanced DI Patterns and Testing

## Testing with DI

### Mock services in tests

```typescript
import 'reflect-metadata';
import { container } from 'tsyringe';
import { TOKENS } from '@~/di/tokens';
import type { MyService } from '@~/features/my-feature/my-feature.service';

describe('MyHandler', () => {
  beforeEach(() => {
    // Mock the service
    const mockService: MyService = {
      doSomething: vi.fn().mockResolvedValue('mocked result'),
    };

    container.register(TOKENS.MyService, { useValue: mockService });
  });

  afterEach(() => {
    container.clearInstances();
  });

  it('should use the service', async () => {
    const service = container.resolve(TOKENS.MyService);
    const result = await service.doSomething('test');
    expect(result).toBe('mocked result');
  });
});
```

### Factory pattern for testability

Export a factory that accepts dependencies explicitly:

```typescript
export class MyService {
  constructor(
    private readonly userService: UserService,
    private readonly logger: Logger,
  ) {}

  public async doSomething() {
    // Business logic
  }
}

// Factory for testing
export function createMyService(
  userService: UserService,
  logger: Logger,
): MyService {
  return new MyService(userService, logger);
}
```

## Service Lifecycle Patterns

### Singleton (default, recommended)

Use for stateless services that can be shared across requests:

```typescript
container.registerSingleton(TOKENS.MyService, MyService);
```

**When to use**:
- Database access layers
- Business logic services
- Utility services
- Logger factories

### Transient

Use for stateful services that must be created per usage:

```typescript
import { Lifecycle } from 'tsyringe';

container.register(TOKENS.MyService, MyService, {
  lifecycle: Lifecycle.Transient,
});
```

**When to use**:
- Services with mutable state
- Request-scoped services
- Short-lived objects

## Best Practices

### Keep services stateless

❌ **Don't**: Store mutable state in singleton services
```typescript
@injectable()
export class BadService {
  private cachedUsers: User[] = []; // BAD - shared state

  public async addUser(user: User) {
    this.cachedUsers.push(user); // Will affect all requests
  }
}
```

✅ **Do**: Keep services stateless or use transient lifecycle
```typescript
@injectable()
export class GoodService {
  public async addUser(user: User) {
    return UserModel.create(user); // Stateless
  }
}
```

### Prefer explicit dependencies

❌ **Don't**: Hide dependencies behind static imports
```typescript
import { UserModel } from '@~/db/models/user.model';

export class BadService {
  public async getUser(id: string) {
    return UserModel.findById(id); // Hard to mock
  }
}
```

✅ **Do**: Inject dependencies explicitly
```typescript
@injectable()
export class GoodService {
  constructor(
    @inject(TOKENS.UserRepository) private userRepo: UserRepository,
  ) {}

  public async getUser(id: string) {
    return this.userRepo.findById(id); // Easy to mock
  }
}
```

### Use descriptive service names

```typescript
// Good names
UserService
ChallengeManagementService
EmailNotificationService
AuthenticationService

// Bad names
DataService
Manager
Helper
Util
```

## Logger Factory Pattern

### Using the logger factory

The repo exposes a `LoggerFactory` token. Use it to create contextual loggers:

```typescript
import { injectable, inject } from 'tsyringe';
import { TOKENS } from '@~/di/tokens';
import type { iLogger } from '@~/di/tokens';

@injectable()
export class MyService {
  private readonly logger: iLogger;

  constructor(@inject(TOKENS.LoggerFactory) loggerFactory: () => iLogger) {
    this.logger = loggerFactory();
  }

  public async performAction() {
    this.logger.info('Starting action', { timestamp: Date.now() });
    
    try {
      // Do something
      this.logger.info('Action completed successfully');
    } catch (error) {
      this.logger.error('Action failed', { error });
      throw error;
    }
  }
}
```

### Benefits of logger factory

- Consistent logging format across services
- Contextual logger names for filtering
- Centralized configuration
- Avoids global logger imports

## Advanced Service Patterns

### Service with caching

```typescript
import { injectable, inject } from 'tsyringe';
import { TOKENS } from '@~/di/tokens';
import type { iLogger } from '@~/di/tokens';
import type { CacheService } from './cache.service';

@injectable()
export class ChallengeService {
  private readonly logger: iLogger;

  constructor(
    @inject(TOKENS.LoggerFactory) loggerFactory: () => iLogger,
    @inject(TOKENS.CacheService) private readonly cache: CacheService
  ) {
    this.logger = loggerFactory();
  }

  public async getChallenge(id: string): Promise<Challenge | null> {
    // Try cache first
    const cached = await this.cache.get<Challenge>(`challenge:${id}`);
    if (cached) {
      this.logger.debug('Cache hit', { challengeId: id });
      return cached;
    }

    // Fetch from database
    this.logger.debug('Cache miss, fetching from DB', { challengeId: id });
    const challenge = await ChallengeModel.findById(id);
    
    if (challenge) {
      await this.cache.set(`challenge:${id}`, challenge, { ttl: 300 });
    }

    return challenge;
  }
}
```

### Service with transaction support

```typescript
import { injectable, inject } from 'tsyringe';
import { TOKENS } from '@~/di/tokens';
import type { iLogger } from '@~/di/tokens';
import mongoose from 'mongoose';

@injectable()
export class UserRegistrationService {
  private readonly logger: iLogger;

  constructor(
    @inject(TOKENS.LoggerFactory) loggerFactory: () => iLogger,
    @inject(TOKENS.UserService) private readonly userService: UserService,
    @inject(TOKENS.ProfileService) private readonly profileService: ProfileService
  ) {
    this.logger = loggerFactory();
  }

  public async registerUser(data: RegistrationData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create user and profile atomically
      const user = await this.userService.create(data, { session });
      const profile = await this.profileService.create(
        { userId: user._id, ...data.profile },
        { session }
      );

      await session.commitTransaction();
      this.logger.info('User registered successfully', { userId: user._id });

      return { user, profile };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error('User registration failed', { error });
      throw error;
    } finally {
      session.endSession();
    }
  }
}
```

### Service with event emission

```typescript
import { injectable, inject } from 'tsyringe';
import { TOKENS } from '@~/di/tokens';
import type { iLogger } from '@~/di/tokens';
import type { EventEmitter } from './event-emitter';

@injectable()
export class OrderService {
  private readonly logger: iLogger;

  constructor(
    @inject(TOKENS.LoggerFactory) loggerFactory: () => iLogger,
    @inject(TOKENS.EventEmitter) private readonly events: EventEmitter
  ) {
    this.logger = loggerFactory();
  }

  public async createOrder(data: CreateOrderInput) {
    const order = await OrderModel.create(data);
    
    this.logger.info('Order created', { orderId: order._id });
    
    // Emit event for other services to react
    await this.events.emit('order.created', { order });
    
    return order;
  }
}
```
