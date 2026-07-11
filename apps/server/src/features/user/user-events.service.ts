import { inject, singleton } from 'tsyringe';

import { USER_PROFILE_REPOSITORY_TOKEN } from '@~/di/tokens';

import { EventBus } from '../events/event-bus';
import { UserAfterRegisteredListener } from '../events/listeners/user.listeners';
import { LoggerFactory } from '../logger/logger.factory';
import type { iWithLogger } from '../logger/logger.types';
import type { iUserProfileRepository } from './user-profile.repository';

@singleton()
export class UserEventsService implements iWithLogger {
  public readonly logger;

  constructor(
    private readonly eventBus: EventBus,
    @inject(USER_PROFILE_REPOSITORY_TOKEN)
    private readonly userProfileRepository: iUserProfileRepository,
    loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.create('user-events');
    this.initialize();
  }

  public initialize() {
    this.eventBus.on(UserAfterRegisteredListener, async ({ userId }) => {
      try {
        await this.userProfileRepository.ensureExists(userId);
        this.logger.info('User profile created successfully', { userId });
      } catch (error) {
        this.logger.error('User profile creation failed', { userId, error });
      }
    });
  }
}
