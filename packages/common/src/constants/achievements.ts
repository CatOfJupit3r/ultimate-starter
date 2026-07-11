import { Enumwaii } from '@startername/enumwaii/enumwaii';
import type { InferEnumwaii } from '@startername/enumwaii/enumwaii';

const userAchievementIdEnumwaii = new Enumwaii('UserAchievementId', ['BETA_TESTER']);

export const USER_ACHIEVEMENTS = userAchievementIdEnumwaii.enum;

export type UserAchievementId = InferEnumwaii<typeof userAchievementIdEnumwaii>;

export const UserAchievementIdSchema = userAchievementIdEnumwaii.schema;

export interface iUserAchievementMeta {
  id: UserAchievementId;
  label: string;
  description: string;
  icon?: string;
  badgeId?: string;
}
