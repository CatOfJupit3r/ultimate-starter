# Service Patterns Reference

Complete examples of common service patterns in the codebase.

## Basic Service with Logger

```typescript
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@~/di/tokens';
import type { iLogger } from '@~/di/tokens';

@injectable()
export class UserService {
  private readonly logger: iLogger;

  constructor(@inject(TOKENS.LoggerFactory) loggerFactory: () => iLogger) {
    this.logger = loggerFactory();
  }

  public async getUser(userId: string): Promise<User | null> {
    this.logger.info('Fetching user', { userId });
    
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        this.logger.warn('User not found', { userId });
        return null;
      }
      
      return user;
    } catch (error) {
      this.logger.error('Failed to fetch user', { userId, error });
      throw error;
    }
  }
}
```

## Service with Dependencies

```typescript
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@~/di/tokens';
import type { iLogger } from '@~/di/tokens';
import type { EmailService } from './email.service';

@injectable()
export class NotificationService {
  private readonly logger: iLogger;

  constructor(
    @inject(TOKENS.LoggerFactory) loggerFactory: () => iLogger,
    @inject(TOKENS.EmailService) private readonly emailService: EmailService
  ) {
    this.logger = loggerFactory();
  }

  public async notifyUser(userId: string, message: string): Promise<void> {
    this.logger.info('Sending notification', { userId });
    
    const user = await UserModel.findById(userId);
    if (!user) {
      this.logger.warn('Cannot notify non-existent user', { userId });
      return;
    }

    await this.emailService.send({
      to: user.email,
      subject: 'Notification',
      body: message,
    });

    this.logger.info('Notification sent', { userId, email: user.email });
  }
}
```

## Service with Multiple Dependencies

```typescript
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@~/di/tokens';
import type { iLogger } from '@~/di/tokens';
import type { CacheService } from './cache.service';
import type { DatabaseService } from './database.service';

@injectable()
export class ChallengeService {
  private readonly logger: iLogger;

  constructor(
    @inject(TOKENS.LoggerFactory) loggerFactory: () => iLogger,
    @inject(TOKENS.CacheService) private readonly cache: CacheService,
    @inject(TOKENS.DatabaseService) private readonly db: DatabaseService
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
    const challenge = await this.db.challenges.findById(id);
    
    if (challenge) {
      await this.cache.set(`challenge:${id}`, challenge, { ttl: 300 });
    }

    return challenge;
  }
}
```

## Stateless vs Stateful Services

### Stateless Service (Singleton - preferred)

Most services should be stateless singletons:

```typescript
import { injectable } from 'tsyringe';

@injectable()
export class HashService {
  public async hash(password: string): Promise<string> {
    // Stateless operation
    return await bcrypt.hash(password, 10);
  }

  public async compare(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}

// In container.ts
container.registerSingleton(TOKENS.HashService, HashService);
```

### Stateful Service (Transient)

Use transient lifecycle when services maintain state per operation:

```typescript
import { injectable } from 'tsyringe';
import { Lifecycle } from 'tsyringe';

@injectable()
export class TransactionService {
  private operations: Operation[] = [];

  public addOperation(op: Operation): void {
    this.operations.push(op);
  }

  public async commit(): Promise<void> {
    // Execute all operations
    for (const op of this.operations) {
      await op.execute();
    }
    this.operations = [];
  }

  public rollback(): void {
    this.operations = [];
  }
}

// In container.ts
container.register(TOKENS.TransactionService, TransactionService, {
  lifecycle: Lifecycle.Transient,
});
```

## Service Testing

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { TOKENS } from '@~/di/tokens';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let mockLogger: iLogger;

  beforeEach(() => {
    // Setup mocks
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    // Register mocks
    container.register(TOKENS.LoggerFactory, {
      useValue: () => mockLogger,
    });

    // Resolve service
    service = container.resolve(TOKENS.UserService);
  });

  it('should fetch user by id', async () => {
    const user = await service.getUser('123');
    
    expect(user).toBeDefined();
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Fetching user',
      { userId: '123' }
    );
  });
});
```
