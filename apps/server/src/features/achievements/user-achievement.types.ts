import type { UserAchievementId } from '@startername/shared/constants/achievements';

import type { userAchievements } from '@~/db/schema';

type UserAchievementRow = typeof userAchievements.$inferSelect;

export type iUserAchievementRecordResponse = Omit<UserAchievementRow, 'achievementId' | 'data'> & {
  achievementId: UserAchievementId;
  data?: Record<string, unknown>;
};
