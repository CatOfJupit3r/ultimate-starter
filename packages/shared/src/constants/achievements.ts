import { z } from 'zod';

export const UserAchievementIdSchema = z.enum([
  'BETA_TESTER',
]);

export const USER_ACHIEVEMENTS = UserAchievementIdSchema.enum;

export type UserAchievementId = z.infer<typeof UserAchievementIdSchema>;

export interface UserAchievementMeta {
  id: UserAchievementId;
  label: string;
  description: string;
  icon?: string;
  badgeId?: string;
}
