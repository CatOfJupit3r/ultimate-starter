import 'reflect-metadata';
import { container, Lifecycle } from 'tsyringe';

export { container };

/**
 * Initialize the DI container.
 * Classes decorated with @singleton() or @injectable() are auto-registered.
 * This function explicitly registers classes that need special lifecycle or configuration.
 *
 * Note: With emitDecoratorMetadata enabled, tsyringe automatically resolves
 * constructor dependencies from their types. No tokens needed for concrete classes.
 */
export async function registerServices() {
  // Import services to trigger decorator registration
  // Dynamic imports avoid circular dependencies at startup
  await import('@~/db/database.service');
  await import('@~/features/auth/auth.service');
  await import('@~/features/achievements/achievements.service');
  await import('@~/features/badges/badges.service');
  await import('@~/features/logger/logger.factory');
  await import('@~/features/events/event-bus');
  await import('@~/features/valkey/valkey.service');

  // UserService is transient (new instance per resolution), unlike the singletons above
  const { UserService } = await import('@~/features/user/user.service');
  container.register(UserService, { useClass: UserService }, { lifecycle: Lifecycle.Transient });
}
