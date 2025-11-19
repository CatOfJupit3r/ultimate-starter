import type { UserAchievementId } from '@startername/shared/constants/achievements';

import type { iAchievementContext, iAchievementDefinition } from '@~/achievements/base-achievement';
import { betaTesterAchievement } from '@~/achievements/betaTester.achievement';
import { USER_ACHIEVEMENTS_META } from '@~/constants/achievements';
import { UserAchievementModel } from '@~/db/models/user-achievements.model';
import { eventBus } from '@~/lib/event-bus';

class AchievementsService {
  private achievements: iAchievementDefinition[] = [betaTesterAchievement];

  private context: iAchievementContext = {
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

  public initialize() {
    for (const achievement of this.achievements) {
      for (const event of achievement.listensTo) {
        eventBus.on(event, async (payload) => {
          try {
            await achievement.handle(payload, this.context);
          } catch (error) {
            console.error(`Error handling achievement ${achievement.id} for event ${event}:`, error);
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

export const achievementsService = new AchievementsService();
