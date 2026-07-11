import { and, eq } from 'drizzle-orm';
import crypto from 'node:crypto';
import { singleton } from 'tsyringe';

import type { UserAchievementId } from '@startername/shared/constants/achievements';

import { PostgresService } from '@~/db/postgres.service';
import { userAchievements } from '@~/db/schema';

import type { iUserAchievementRepository } from './user-achievement.repository';
import type { UserAchievementRecordResponse } from './user-achievement.types';

type UserAchievementRow = typeof userAchievements.$inferSelect;

function toResponse(achievement: UserAchievementRow): UserAchievementRecordResponse {
  return {
    id: achievement.id,
    userId: achievement.userId,
    achievementId: achievement.achievementId,
    unlockedAt: achievement.unlockedAt,
    data: achievement.data ?? undefined,
    createdAt: achievement.createdAt,
    updatedAt: achievement.updatedAt,
  };
}

@singleton()
export class DrizzleUserAchievementRepository implements iUserAchievementRepository {
  constructor(private readonly postgresService: PostgresService) {}

  public async listByUserId(userId: string) {
    const rows = await this.postgresService
      .getDb()
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));
    return rows.map(toResponse);
  }

  public async findByAchievement(userId: string, achievementId: UserAchievementId) {
    const [row] = await this.postgresService
      .getDb()
      .select()
      .from(userAchievements)
      .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievementId)))
      .limit(1);
    return row ? toResponse(row) : null;
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

    if (inserted) return toResponse(inserted);

    const existing = await this.findByAchievement(userId, achievementId);
    if (!existing) throw new Error('User achievement upsert returned no row');
    return existing;
  }
}
