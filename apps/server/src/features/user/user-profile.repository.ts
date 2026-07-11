import type { UserProfileResponse, UpsertUserProfileInput } from './user.types';

export interface iUserProfileRepository {
  findByUserId: (userId: string) => Promise<UserProfileResponse | null>;
  ensureExists: (userId: string) => Promise<UserProfileResponse>;
  upsert: (userId: string, input: UpsertUserProfileInput) => Promise<UserProfileResponse>;
  deleteByUserId: (userId: string) => Promise<boolean>;
}
