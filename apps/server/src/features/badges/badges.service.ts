import { inject, singleton } from 'tsyringe';

import { TOKENS } from '@~/di/tokens';

import type { iWithLogger, LoggerFactory } from '../logger/logger.types';
import { BADGES_META } from './badges.constants';

@singleton()
export class BadgesService implements iWithLogger {
  public readonly logger: iWithLogger['logger'];

  constructor(@inject(TOKENS.LoggerFactory) loggerFactory: LoggerFactory) {
    this.logger = loggerFactory.create('badges');
  }

  public async listAllBadges() {
    this.logger.debug('Listing all badges');
    return BADGES_META;
  }
}
