import { badgesService } from '@~/services/badges.service';

import { base, publicProcedure } from '../lib/orpc';

export const badgesRouter = base.badges.router({
  listBadges: publicProcedure.badges.listBadges.handler(async () => badgesService.listAllBadges()),
});
