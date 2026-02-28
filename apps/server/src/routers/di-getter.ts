import { container } from 'tsyringe';

import { DatabaseService } from '@~/db/database.service';
import { AchievementsService } from '@~/features/achievements/achievements.service';
import { AuthService } from '@~/features/auth/auth.service';
import { BadgesService } from '@~/features/badges/badges.service';
import { EventBus } from '@~/features/events/event-bus';
import { LoggerFactory } from '@~/features/logger/logger.factory';
import { UserService } from '@~/features/user/user.service';
import { ValkeyService } from '@~/features/valkey/valkey.service';

/**
 * Service getters for router handlers.
 * These use native tsyringe resolution - classes with @singleton() or @injectable()
 * decorators are automatically resolved from constructor parameter types.
 */
export const GETTERS = {
  DatabaseService: () => container.resolve(DatabaseService),
  AuthService: () => container.resolve(AuthService),
  AchievementsService: () => container.resolve(AchievementsService),
  BadgesService: () => container.resolve(BadgesService),
  EventBus: () => container.resolve(EventBus),
  UserService: () => container.resolve(UserService),
  LoggerFactory: () => container.resolve(LoggerFactory),
  ValkeyService: () => container.resolve(ValkeyService),
} as const;
