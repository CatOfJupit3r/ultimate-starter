import 'reflect-metadata';
import { container } from 'tsyringe';

import { DrizzleUserAchievementRepository } from '@~/features/achievements/drizzle-user-achievement.repository';
import type { iUserAchievementRepository } from '@~/features/achievements/user-achievement.repository';
import type { iAuthUserRepository } from '@~/features/auth/auth-user.repository';
import { DrizzleAuthUserRepository } from '@~/features/auth/drizzle-auth-user.repository';
import { DrizzleUserProfileRepository } from '@~/features/user/drizzle-user-profile.repository';
import type { iUserProfileRepository } from '@~/features/user/user-profile.repository';

import { AUTH_USER_REPOSITORY_TOKEN, USER_ACHIEVEMENT_REPOSITORY_TOKEN, USER_PROFILE_REPOSITORY_TOKEN } from './tokens';

export { container };

export async function registerServices() {
  await import('@~/db/postgres.service');
  await import('@~/features/auth/auth.service');
  await import('@~/features/achievements/achievements.service');
  await import('@~/features/badges/badges.service');
  await import('@~/features/logger/logger.factory');
  await import('@~/features/events/event-bus');
  await import('@~/features/valkey/valkey.service');
  await import('@~/features/user/user.service');
  await import('@~/features/user/user-events.service');

  container.registerSingleton<iAuthUserRepository>(AUTH_USER_REPOSITORY_TOKEN, DrizzleAuthUserRepository);
  container.registerSingleton<iUserAchievementRepository>(
    USER_ACHIEVEMENT_REPOSITORY_TOKEN,
    DrizzleUserAchievementRepository,
  );
  container.registerSingleton<iUserProfileRepository>(USER_PROFILE_REPOSITORY_TOKEN, DrizzleUserProfileRepository);
}
