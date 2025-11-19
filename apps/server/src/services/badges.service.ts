import { BADGES_META } from '@~/constants/badges';

class BadgesService {
  public async listAllBadges() {
    return BADGES_META;
  }
}

export const badgesService = new BadgesService();
