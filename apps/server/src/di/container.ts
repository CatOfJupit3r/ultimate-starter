import 'reflect-metadata';
import { container, Lifecycle } from 'tsyringe';

import { TOKENS } from './tokens';
import type { iTokenRegistry } from './tokens';

export { container };

// Function to register all services in the container
export async function registerServices() {
  // Import services dynamically to avoid circular dependencies
  const { DatabaseService } = await import('@~/db/database.service');
  const { AuthService } = await import('@~/features/auth/auth.service');
  const { AchievementsService } = await import('@~/features/achievements/achievements.service');
  const { BadgesService } = await import('@~/features/badges/badges.service');
  const { UserService } = await import('@~/features/user/user.service');
  const { LoggerFactoryImpl } = await import('@~/features/logger/logger.factory');
  const { TypedEventBus } = await import('@~/features/events/event-bus');
  const { ValkeyService } = await import('@~/features/valkey/valkey.service');

  // Register singletons with their tokens
  container.registerSingleton(TOKENS.EventBus, TypedEventBus);
  container.registerSingleton(TOKENS.DatabaseService, DatabaseService);
  container.registerSingleton(TOKENS.AuthService, AuthService);
  container.registerSingleton(TOKENS.AchievementsService, AchievementsService);
  container.registerSingleton(TOKENS.BadgesService, BadgesService);
  container.registerSingleton(TOKENS.LoggerFactory, LoggerFactoryImpl);
  container.registerSingleton(TOKENS.ValkeyService, ValkeyService);
  container.register(TOKENS.UserService, { useClass: UserService }, { lifecycle: Lifecycle.Transient });
}

// Helper function to resolve services
export function resolve<T extends keyof iTokenRegistry>(token: T): iTokenRegistry[T] {
  return container.resolve<iTokenRegistry[T]>(token);
}
