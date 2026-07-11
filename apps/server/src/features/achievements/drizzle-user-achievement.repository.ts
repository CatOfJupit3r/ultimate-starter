import { and, eq } from 'drizzle-orm';
import crypto from 'node:crypto';
import { singleton } from 'tsyringe';

import type { UserAchievementId } from '@startername/common/constants/achievements';

import { PostgresService } from '@~/db/postgres.service';
import { userAchievements } from '@~/db/schema/user-achievement.schema';

import type { iUserAchievementRepository } from './user-achievement.repository';
import { UserAchievementResolver } from './user-achievement.resolver';

@singleton()
export class DrizzleUserAchievementRepository implements iUserAchievementRepository {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly userAchievementResolver: UserAchievementResolver,
  ) {}

  public async listByUserId(userId: string) {
    const rows = await this.postgresService
      .getDb()
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));
    return rows.map((row) => this.userAchievementResolver.toUserAchievementResponse(row));
  }

  public async findByAchievement(userId: string, achievementId: UserAchievementId) {
    const [row] = await this.postgresService
      .getDb()
      .select()
      .from(userAchievements)
      .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievementId)))
      .limit(1);
    return row ? this.userAchievementResolver.toUserAchievementResponse(row) : null;
  }

  public async ensureUnlocked(userId: string, achievementId: UserAchievementId, data?: Record<string, unknown>) {
    const [inserted] = await this.postgresService
      .getDb()
      .insert(userAchievements)
      .values({
        id: crypto.randomUUID(),
        userId,
        achievementId,
        unlockedAt: new Date(),
        data: data ?? null,
      })
      .onConflictDoNothing({ target: [userAchievements.userId, userAchievements.achievementId] })
      .returning();

    if (inserted) return this.userAchievementResolver.toUserAchievementResponse(inserted);

    const existing = await this.findByAchievement(userId, achievementId);
    if (!existing) throw new Error('User achievement upsert returned no row');
    return existing;
  }
}
