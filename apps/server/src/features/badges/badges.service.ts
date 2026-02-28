import { singleton } from 'tsyringe';

import { LoggerFactory } from '../logger/logger.factory';
import type { iWithLogger } from '../logger/logger.types';
import { BADGES_META } from './badges.constants';

@singleton()
export class BadgesService implements iWithLogger {
  public readonly logger: iWithLogger['logger'];

  constructor(loggerFactory: LoggerFactory) {
    this.logger = loggerFactory.create('badges');
  }

  public async listAllBadges() {
    this.logger.debug('Listing all badges');
    return BADGES_META;
  }
}
