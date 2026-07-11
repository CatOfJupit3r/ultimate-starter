import { container } from '@~/di';
import { USER_ACHIEVEMENT_REPOSITORY_TOKEN, USER_PROFILE_REPOSITORY_TOKEN } from '@~/di/tokens';
import type { iUserAchievementRepository } from '@~/features/achievements/user-achievement.repository';
import type { iUserProfileRepository } from '@~/features/user/user-profile.repository';

export function getUserAchievementRepository() {
  return container.resolve<iUserAchievementRepository>(USER_ACHIEVEMENT_REPOSITORY_TOKEN);
}

export function getUserProfileRepository() {
  return container.resolve<iUserProfileRepository>(USER_PROFILE_REPOSITORY_TOKEN);
}
