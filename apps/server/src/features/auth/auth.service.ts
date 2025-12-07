import type { mongoose } from '@typegoose/typegoose';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { username } from 'better-auth/plugins';
import type Redis from 'ioredis';
import { isNil } from 'lodash-es';
import { inject, singleton } from 'tsyringe';

import env from '@~/constants/env';
import { UserProfileModel } from '@~/db/models/user-profile.model';
import { TOKENS } from '@~/di/tokens';

import type { iWithLogger, LoggerFactory, LoggerType } from '../logger/logger.types';
import { devImpersonatePlugin } from './better-auth-plugins/dev-impersonate.plugin';

const createInstance = (db: mongoose.mongo.Db, logger: LoggerType, valkey: Redis | Nil) =>
  betterAuth({
    database: mongodbAdapter(db),
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
      defaultCookieAttributes: {
        sameSite: 'none',
        secure: true,
        httpOnly: true,
      },
    },
    experimental: {
      joins: true,
    },
    databaseHooks: {
      user: {
        create: {
          async after(user) {
            try {
              await UserProfileModel.create({ userId: user.id });
            } catch (e) {
              logger.error('Please pay attention to this error! User profile creation failed.', { error: e });
            }
          },
        },
      },
    },
  });

@singleton()
export class AuthService implements iWithLogger {
  public readonly logger: iWithLogger['logger'];

  private instance: ReturnType<typeof createInstance> | null = null;

  constructor(@inject(TOKENS.LoggerFactory) loggerFactory: LoggerFactory) {
    this.logger = loggerFactory.create('auth');
  }

  public connect(db: mongoose.mongo.Db, valkey: Redis | Nil) {
    this.instance = createInstance(db, this.logger, valkey);
  }

  public getInstance() {
    if (!this.instance) throw new Error('AuthService not initialized. Call connect() first.');

    return this.instance;
  }
}
