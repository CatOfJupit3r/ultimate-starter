import { em } from 'enumwaii';
import { emToZodSchema } from 'enumwaii/zod';

const userAchievementIdEnumwaii = em(['BETA_TESTER']);

export const USER_ACHIEVEMENTS = userAchievementIdEnumwaii.enum;

export type UserAchievementId = (typeof userAchievementIdEnumwaii)['~type'];

export const UserAchievementIdSchema = emToZodSchema(userAchievementIdEnumwaii);

export interface iUserAchievementMeta {
  id: UserAchievementId;
  label: string;
  description: string;
  icon?: string;
  badgeId?: string;
}
