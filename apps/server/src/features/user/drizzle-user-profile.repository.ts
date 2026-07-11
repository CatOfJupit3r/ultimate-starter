import { eq } from 'drizzle-orm';
import { singleton } from 'tsyringe';

import { generatePublicCode } from '@~/db/helpers';
import { PostgresService } from '@~/db/postgres.service';
import { userProfiles } from '@~/db/schema';

import type { iUserProfileRepository } from './user-profile.repository';
import type { UserProfileResponse, UpsertUserProfileInput } from './user.types';

type UserProfileRow = typeof userProfiles.$inferSelect;

function toResponse(profile: UserProfileRow): UserProfileResponse {
  return {
    id: profile.id,
    userId: profile.userId,
    bio: profile.bio,
    selectedBadge: profile.selectedBadge ?? null,
    publicCode: profile.publicCode,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

function getDefaultValues(userId: string) {
  const values: typeof userProfiles.$inferInsert = {
    userId,
    bio: '',
    selectedBadge: null,
    publicCode: generatePublicCode(),
  };

  return values;
}

@singleton()
export class DrizzleUserProfileRepository implements iUserProfileRepository {
  constructor(private readonly postgresService: PostgresService) {}

  public async findByUserId(userId: string) {
    const [profile] = await this.postgresService
      .getDb()
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);
    return profile ? toResponse(profile) : null;
  }

  public async deleteByUserId(userId: string) {
    const rows = await this.postgresService
      .getDb()
      .delete(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .returning({ userId: userProfiles.userId });
    return rows.length > 0;
  }

  public async ensureExists(userId: string) {
    const [inserted] = await this.postgresService
      .getDb()
      .insert(userProfiles)
      .values(getDefaultValues(userId))
      .onConflictDoNothing({ target: userProfiles.userId })
      .returning();

    if (inserted) return toResponse(inserted);

    const existing = await this.findByUserId(userId);
    if (!existing) throw new Error('User profile upsert returned no row');
    return existing;
  }

  public async upsert(userId: string, input: UpsertUserProfileInput) {
    const defaults = getDefaultValues(userId);
    if (input.bio !== undefined) defaults.bio = input.bio;
    if (input.selectedBadge !== undefined) defaults.selectedBadge = input.selectedBadge;
    if (input.publicCode !== undefined) defaults.publicCode = input.publicCode;

    const [profile] = await this.postgresService
      .getDb()
      .insert(userProfiles)
      .values(defaults)
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: {
          ...(input.bio !== undefined ? { bio: input.bio } : {}),
          ...(input.selectedBadge !== undefined ? { selectedBadge: input.selectedBadge } : {}),
          ...(input.publicCode !== undefined ? { publicCode: input.publicCode } : {}),
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!profile) throw new Error('User profile upsert returned no row');
    return toResponse(profile);
  }
}
