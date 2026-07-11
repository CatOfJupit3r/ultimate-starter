import { inject, singleton } from 'tsyringe';

import type { UserAchievementId } from '@startername/shared/constants/achievements';

import { USER_ACHIEVEMENT_REPOSITORY_TOKEN } from '@~/di/tokens';
import type { iAchievementContext, iAchievementDefinition } from '@~/features/achievements/achievements.types';
import type { iUserAchievementRepository } from '@~/features/achievements/user-achievement.repository';
import { EventBus } from '@~/features/events/event-bus';
import { AchievementUnlockedListener } from '@~/features/events/listeners/achievements.listeners';
import { buildCacheKey, CACHE_TTL } from '@~/features/valkey/valkey.constants';
import { ValkeyService } from '@~/features/valkey/valkey.service';

import { LoggerFactory } from '../logger/logger.factory';
import type { iWithLogger } from '../logger/logger.types';
import { USER_ACHIEVEMENTS_META } from './achievements.constants';
import { betaTesterAchievement } from './concrete-achievements/beta-tester.achievement';

@singleton()
export class AchievementsService implements iWithLogger {
  private readonly achievements: iAchievementDefinition[] = [betaTesterAchievement];

  public readonly logger: iWithLogger['logger'];

  private readonly context: iAchievementContext = {
    unlock: async (userId: string, achievementId: UserAchievementId, data?: Record<string, unknown>) => {
      await this.userAchievementRepository.ensureUnlocked(userId, achievementId, data);
      await this.eventBus.emit(AchievementUnlockedListener, { userId, achievementId });
    },
  };

  constructor(
    private readonly eventBus: EventBus,
    @inject(USER_ACHIEVEMENT_REPOSITORY_TOKEN)
    private readonly userAchievementRepository: iUserAchievementRepository,
    private readonly valkey: ValkeyService,
    loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.create('achievements');
    this.initialize();
  }

  public initialize() {
    for (const achievement of this.achievements) {
      for (const listener of achievement.listensTo) {
        this.eventBus.on(listener, async (payload) => {
          try {
            await achievement.handle(payload, this.context);
          } catch (error) {
            this.logger.error(`Error handling achievement ${achievement.id} for event ${listener.name}:`, { error });
          }
        });
      }
    }

    this.eventBus.on(AchievementUnlockedListener, async ({ userId, achievementId }) => {
      await this.valkey.cacheDel(buildCacheKey.userAchievements(userId));
      this.logger.debug('Achievement unlocked, invalidated user achievements cache', { userId, achievementId });
    });
  }

  public async listAllAchievements() {
    return this.valkey.cached(buildCacheKey.achievements(), CACHE_TTL.STATIC, async () => USER_ACHIEVEMENTS_META);
  }

  public async getUserAchievements(userId: string) {
    return this.valkey.cached(buildCacheKey.userAchievements(userId), CACHE_TTL.USER_DATA, async () => {
      const userAchievements = await this.userAchievementRepository.listByUserId(userId);

      return userAchievements.map((achievement) => {
        const meta = USER_ACHIEVEMENTS_META.find((item) => item.id === achievement.achievementId);
        return {
          id: achievement.achievementId,
          unlockedAt: achievement.unlockedAt,
          data: achievement.data,
          meta: meta ?? {
            id: achievement.achievementId,
            label: achievement.achievementId,
            description: 'Achievement',
          },
        };
      });
    });
  }
}
