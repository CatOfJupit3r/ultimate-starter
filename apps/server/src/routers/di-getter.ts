import { resolve } from '@~/di';
import { TOKENS } from '@~/di/tokens';

export const GETTERS = {
  AuthService: () => resolve(TOKENS.AuthService),
  AchievementsService: () => resolve(TOKENS.AchievementsService),
  BadgesService: () => resolve(TOKENS.BadgesService),
  UserService: () => resolve(TOKENS.UserService),
  DatabaseService: () => resolve(TOKENS.DatabaseService),
  EventBus: () => resolve(TOKENS.EventBus),
};
