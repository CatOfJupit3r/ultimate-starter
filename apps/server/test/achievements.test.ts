import { describe, expect, it } from 'bun:test';

import { USER_ACHIEVEMENTS } from '@startername/shared/constants/achievements';

import { UserAchievementModel } from '@~/db/models/user-achievements.model';
import { EVENTS } from '@~/enums/events.enums';
import { eventBus } from '@~/lib/event-bus';
import { achievementsService } from '@~/services/achievements.service';

import { createUser } from './helpers/utilities';

describe('Achievements System', () => {
  it('should list all available achievements', async () => {
    const achievements = await achievementsService.listAllAchievements();

    expect(achievements).toBeDefined();
    expect(achievements.length).toBeGreaterThan(0);
    expect(achievements[0]).toHaveProperty('id');
    expect(achievements[0]).toHaveProperty('label');
    expect(achievements[0]).toHaveProperty('description');
  });

  it('should return empty array for user with no achievements', async () => {
    const user = await createUser();
    const userId = user.user.id;

    const userAchievements = await achievementsService.getUserAchievements(userId);

    expect(userAchievements).toBeDefined();
    expect(userAchievements).toHaveLength(0);
  });
});
