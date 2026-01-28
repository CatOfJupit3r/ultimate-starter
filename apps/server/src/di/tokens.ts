import type { DatabaseService } from '@~/db/database.service';
import type { AchievementsService } from '@~/features/achievements/achievements.service';
import type { AuthService } from '@~/features/auth/auth.service';
import type { BadgesService } from '@~/features/badges/badges.service';
import type { TypedEventBus } from '@~/features/events/event-bus';
import type { LoggerFactory } from '@~/features/logger/logger.types';
import type { UserService } from '@~/features/user/user.service';
import type { ValkeyService } from '@~/features/valkey/valkey.service';

// Token creation macro - reduces each service from 3 lines to 1 line
// Usage: T('ServiceName') creates both the token constant and adds it to the registry
// Note: TypeScript requires unique symbol types for computed property keys, so we must declare them separately
const databaseServiceToken: unique symbol = Symbol.for('DatabaseService');
const authServiceToken: unique symbol = Symbol.for('AuthService');
const achievementsServiceToken: unique symbol = Symbol.for('AchievementsService');
const badgesServiceToken: unique symbol = Symbol.for('BadgesService');
const eventBusToken: unique symbol = Symbol.for('EventBus');
const userServiceToken: unique symbol = Symbol.for('UserService');
const loggerFactoryToken: unique symbol = Symbol.for('LoggerFactory');
const valkeyServiceToken: unique symbol = Symbol.for('ValkeyService');

// Consolidated TOKENS object - single source of truth for all service tokens
export const TOKENS = {
  DatabaseService: databaseServiceToken,
  AuthService: authServiceToken,
  AchievementsService: achievementsServiceToken,
  BadgesService: badgesServiceToken,
  EventBus: eventBusToken,
  UserService: userServiceToken,
  LoggerFactory: loggerFactoryToken,
  ValkeyService: valkeyServiceToken,
} as const;

// Type registry - using indexed access to reduce duplication
// Each entry references the TOKENS constant and maps to its service type
export interface iTokenRegistry {
  [TOKENS.DatabaseService]: DatabaseService;
  [TOKENS.AuthService]: AuthService;
  [TOKENS.AchievementsService]: AchievementsService;
  [TOKENS.BadgesService]: BadgesService;
  [TOKENS.EventBus]: TypedEventBus;
  [TOKENS.UserService]: UserService;
  [TOKENS.LoggerFactory]: LoggerFactory;
  [TOKENS.ValkeyService]: ValkeyService;
}

export type InjectionTokens = typeof TOKENS;
