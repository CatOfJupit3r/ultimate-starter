import Redis from 'ioredis';
import { inject, singleton } from 'tsyringe';

import env from '@~/constants/env';
import { TOKENS } from '@~/di/tokens';

import type { iWithLogger, LoggerFactory, LoggerType } from '../logger/logger.types';

@singleton()
export class ValkeyService implements iWithLogger {
  public readonly logger: LoggerType;

  private client: Redis | Nil = null;

  constructor(@inject(TOKENS.LoggerFactory) loggerFactory: LoggerFactory) {
    this.logger = loggerFactory.create('valkey');
  }

  public async connect() {
    if (this.client) return this.client;
    if (env.NODE_ENV === 'test') {
      this.logger.info('Valkey connection skipped in test environment');
      return null;
    }

    this.client = new Redis({
      host: env.VALKEY_HOST,
      port: env.VALKEY_PORT,
      username: env.VALKEY_USERNAME,
      password: env.VALKEY_PASSWORD,
      db: env.VALKEY_DB,
    });

    this.client.on('error', (error) => {
      this.logger.error('Valkey connection error', { error });
    });

    this.client.on('connect', () => {
      this.logger.info('Valkey connected');
    });

    await this.client.ping();
    return this.client;
  }

  public getClient() {
    if (!this.client) throw new Error('Valkey client is not connected');
    return this.client;
  }

  public async disconnect() {
    if (!this.client) return;
    await this.client.quit();
    this.client = null;
  }
}
