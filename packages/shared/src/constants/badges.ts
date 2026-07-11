import { Enumwaii } from '@startername/enumwaii/enumwaii';
import type { InferEnumwaii } from '@startername/enumwaii/enumwaii';

import type { UserAchievementId } from './achievements';

const badgeIdEnumwaii = new Enumwaii('BadgeId', ['BETA_TESTER', 'DEFAULT']);

export const BADGE_IDS = badgeIdEnumwaii.enum;

export type BadgeId = InferEnumwaii<typeof badgeIdEnumwaii>;

export const BadgeIdSchema = badgeIdEnumwaii.schema;

export interface iBadgeMeta {
  id: BadgeId;
  label: string;
  description: string;
  icon?: string;
  requiresAchievement?: UserAchievementId;
}
