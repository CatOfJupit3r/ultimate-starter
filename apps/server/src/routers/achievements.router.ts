import { achievementsService } from '@~/services/achievements.service';

import { base, protectedProcedure, publicProcedure } from '../lib/orpc';

export const achievementsRouter = base.achievements.router({
  listAchievements: publicProcedure.achievements.listAchievements.handler(async () =>
    achievementsService.listAllAchievements(),
  ),

  getMyAchievements: protectedProcedure.achievements.getMyAchievements.handler(async ({ context }) => {
    const userId = context.session.user.id;
    return achievementsService.getUserAchievements(userId);
  }),
});
