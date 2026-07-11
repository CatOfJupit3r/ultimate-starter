import type { UserAchievementId } from '@startername/shared/constants/achievements';

import type { UserAchievementRecordResponse } from './user-achievement.types';

export interface iUserAchievementRepository {
  listByUserId: (userId: string) => Promise<UserAchievementRecordResponse[]>;
  findByAchievement: (
    userId: string,
    achievementId: UserAchievementId,
  ) => Promise<UserAchievementRecordResponse | null>;
  ensureUnlocked: (
    userId: string,
    achievementId: UserAchievementId,
    data?: Record<string, unknown>,
  ) => Promise<UserAchievementRecordResponse>;
}
