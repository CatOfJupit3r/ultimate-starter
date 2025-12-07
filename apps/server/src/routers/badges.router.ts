import { base, publicProcedure } from '../lib/orpc';
import { GETTERS } from './di-getter';

export const badgesRouter = base.badges.router({
  listBadges: publicProcedure.badges.listBadges.handler(async () => GETTERS.BadgesService().listAllBadges()),
});
