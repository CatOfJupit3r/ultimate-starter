import { base, protectedProcedure, publicProcedure } from '../lib/orpc';
import { GETTERS } from './di-getter';

export const achievementsRouter = base.achievements.router({
  listAchievements: publicProcedure.achievements.listAchievements.handler(async () =>
    GETTERS.AchievementsService().listAllAchievements(),
  ),

  getMyAchievements: protectedProcedure.achievements.getMyAchievements.handler(async ({ context }) => {
    const userId = context.session.user.id;
    return GETTERS.AchievementsService().getUserAchievements(userId);
  }),
});
