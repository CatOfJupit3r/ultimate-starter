import { em } from 'enumwaii';
import { emToZodSchema } from 'enumwaii/zod';

import type { UserAchievementId } from './achievements';

const badgeIdEnumwaii = em(['BETA_TESTER', 'DEFAULT']);

export const BADGE_IDS = badgeIdEnumwaii.enum;

export type BadgeId = (typeof badgeIdEnumwaii)['~type'];

export const BadgeIdSchema = emToZodSchema(badgeIdEnumwaii);

export interface iBadgeMeta {
  id: BadgeId;
  label: string;
  description: string;
  icon?: string;
  requiresAchievement?: UserAchievementId;
}
