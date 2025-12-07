import { describe, expect, it } from 'bun:test';

import { resolve } from '@~/di';
import { TOKENS } from '@~/di/tokens';

import { createUser } from './helpers/utilities';

const getAchievementsService = () => resolve(TOKENS.AchievementsService);

describe('Achievements System', () => {
  it('should list all available achievements', async () => {
    const achievementsService = getAchievementsService();
    const achievements = await achievementsService.listAllAchievements();

    expect(achievements).toBeDefined();
    expect(achievements.length).toBeGreaterThan(0);
    expect(achievements[0]).toHaveProperty('id');
    expect(achievements[0]).toHaveProperty('label');
    expect(achievements[0]).toHaveProperty('description');
  });

  it('should return empty array for user with no achievements', async () => {
    const achievementsService = getAchievementsService();
    const user = await createUser();
    const userId = user.user.id;

    const userAchievements = await achievementsService.getUserAchievements(userId);

    expect(userAchievements).toBeDefined();
    expect(userAchievements).toHaveLength(0);
  });
});
