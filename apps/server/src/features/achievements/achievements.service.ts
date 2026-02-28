import { singleton } from 'tsyringe';

import type { UserAchievementId } from '@startername/shared/constants/achievements';

import { UserAchievementModel } from '@~/db/models/user-achievements.model';
import type { iAchievementContext, iAchievementDefinition } from '@~/features/achievements/achievements.types';
import { EventBus } from '@~/features/events/event-bus';

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
      const existingAchievement = await UserAchievementModel.findOne({ userId, achievementId });

      if (existingAchievement) {
        return;
      }

      await UserAchievementModel.create({
        userId,
        achievementId,
        unlockedAt: new Date(),
        data,
      });
    },
  };

  constructor(
    private readonly eventBus: EventBus,
    loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.create('achievements');
    this.logger.info('AchievementsService initialized');
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
  }

  public async listAllAchievements() {
    return USER_ACHIEVEMENTS_META;
  }

  public async getUserAchievements(userId: string) {
    const userAchievements = await UserAchievementModel.find({ userId });

    return userAchievements.map((achievement) => {
      const meta = USER_ACHIEVEMENTS_META.find((m) => m.id === achievement.achievementId);
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
  }
}
