import type { BadgeId } from '@startername/shared/constants/badges';

export interface iUserProfileResponse {
  id: string;
  userId: string;
  bio: string;
  selectedBadge?: BadgeId | null;
  publicCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface iUpsertUserProfileInput {
  bio?: string;
  selectedBadge?: BadgeId | null;
  publicCode?: string;
}

export type UserProfileResponse = iUserProfileResponse;
export type UpsertUserProfileInput = iUpsertUserProfileInput;
