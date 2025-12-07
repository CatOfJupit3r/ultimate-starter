import { USER_ACHIEVEMENTS } from '@startername/shared/constants/achievements';

import { EVENTS } from '@~/features/events/events.constants';

import type { iAchievementContext, iAchievementDefinition } from '../achievements.types';

export const betaTesterAchievement: iAchievementDefinition = {
  id: USER_ACHIEVEMENTS.BETA_TESTER,
  listensTo: [EVENTS.BETA_EVENT],
  async handle(payload, context: iAchievementContext) {
    await context.unlock(payload.userId, USER_ACHIEVEMENTS.BETA_TESTER, {});
  },
};
