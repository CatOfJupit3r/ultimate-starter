import type { UserAchievementId } from '@startername/shared/constants/achievements';

export interface iUserAchievementRecordResponse {
  id: string;
  userId: string;
  achievementId: UserAchievementId;
  unlockedAt: Date;
  data?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type UserAchievementRecordResponse = iUserAchievementRecordResponse;
