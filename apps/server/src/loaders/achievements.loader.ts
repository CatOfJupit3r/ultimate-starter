import { resolve } from '@~/di';
import { TOKENS } from '@~/di/tokens';

export default async function achievementsLoader() {
  const achievementsService = resolve(TOKENS.AchievementsService);
  achievementsService.initialize();
}
