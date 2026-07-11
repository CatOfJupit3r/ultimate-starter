import { eq } from 'drizzle-orm';
import { singleton } from 'tsyringe';

import { generatePublicCode } from '@~/db/helpers';
import { PostgresService } from '@~/db/postgres.service';
import { userProfiles } from '@~/db/schema';

import type { iUserProfileRepository } from './user-profile.repository';
import { UserProfileResolver } from './user-profile.resolver';
import type { iUpsertUserProfileInput } from './user.types';

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
  constructor(
    private readonly postgresService: PostgresService,
    private readonly userProfileResolver: UserProfileResolver,
  ) {}

  public async findByUserId(userId: string) {
    const [profile] = await this.postgresService
      .getDb()
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);
    return profile ? this.userProfileResolver.toUserProfileResponse(profile) : null;
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

    if (inserted) return this.userProfileResolver.toUserProfileResponse(inserted);

    const existing = await this.findByUserId(userId);
    if (!existing) throw new Error('User profile upsert returned no row');
    return existing;
  }

  public async upsert(userId: string, input: iUpsertUserProfileInput) {
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
    return this.userProfileResolver.toUserProfileResponse(profile);
  }
}
