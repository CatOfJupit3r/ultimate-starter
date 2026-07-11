import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth';
import { username } from 'better-auth/plugins';
import type Redis from 'ioredis';
import { singleton } from 'tsyringe';

import { isNil } from '@startername/shared/helpers/std-utils';

import env from '@~/constants/env';
import { PostgresService } from '@~/db/postgres.service';
import {
  accounts,
  accountsRelations,
  sessions,
  sessionsRelations,
  users,
  usersRelations,
  verifications,
} from '@~/db/schema/auth.schema';
import { EventBus } from '@~/features/events/event-bus';
import { UserAfterRegisteredListener } from '@~/features/events/listeners/user.listeners';

import { LoggerFactory } from '../logger/logger.factory';
import type { iWithLogger, LoggerType } from '../logger/logger.types';
import { devImpersonatePlugin } from './better-auth-plugins/dev-impersonate.plugin';

function createDatabaseAdapter(postgresService: PostgresService) {
  return drizzleAdapter(postgresService.getDb(), {
    provider: 'pg',
    schema: {
      users,
      usersRelations,
      sessions,
      sessionsRelations,
      accounts,
      accountsRelations,
      verifications,
    },
    usePlural: true,
  });
}

const createInstance = (
  postgresService: PostgresService,
  logger: LoggerType,
  valkey: Redis | Nil,
  eventBus: EventBus,
) =>
  betterAuth({
    database: createDatabaseAdapter(postgresService),
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [process.env.CORS_ORIGIN ?? ''],
    plugins: [username(), devImpersonatePlugin()],
    secondaryStorage: !isNil(valkey)
      ? {
          get: async (key) => valkey.get(key),
          set: async (key, value, ttl) => {
            if (ttl) await valkey.set(key, value, 'EX', ttl);
            else await valkey.set(key, value);
          },
          delete: async (key) => {
            await valkey.del(key);
          },
        }
      : undefined,
    emailAndPassword: {
      enabled: true,
    },
    telemetry: {
      enabled: false,
    },
    basePath: '/auth',
    advanced: {
      database: {
        generateId: 'uuid',
      },
      defaultCookieAttributes: {
        sameSite: env.AUTH_COOKIE_SAME_SITE,
        secure: env.AUTH_COOKIE_SECURE,
        httpOnly: true,
      },
    },
    experimental: {
      joins: false,
    },
    databaseHooks: {
      user: {
        create: {
          async after(user) {
            await eventBus.emit(UserAfterRegisteredListener, { userId: user.id });
          },
        },
      },
    },
  });

@singleton()
export class AuthService implements iWithLogger {
  public readonly logger;

  private instance: ReturnType<typeof createInstance> | null = null;

  constructor(
    loggerFactory: LoggerFactory,
    private readonly postgresService: PostgresService,
    private readonly eventBus: EventBus,
  ) {
    this.logger = loggerFactory.create('auth');
  }

  public connect(valkey: Redis | Nil) {
    this.instance = createInstance(this.postgresService, this.logger, valkey, this.eventBus);
  }

  public getInstance() {
    if (!this.instance) throw new Error('AuthService not initialized. Call connect() first.');

    return this.instance;
  }
}
