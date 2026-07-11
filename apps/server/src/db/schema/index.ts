import {
  accounts,
  accountsRelations,
  sessions,
  sessionsRelations,
  users,
  usersRelations,
  verifications,
} from './auth.schema';
import { userAchievements } from './user-achievement.schema';
import { userProfiles } from './user-profile.schema';

export * from './auth.schema';
export * from './user-achievement.schema';
export * from './user-profile.schema';

export const schema = {
  users,
  usersRelations,
  sessions,
  sessionsRelations,
  accounts,
  accountsRelations,
  verifications,
  userAchievements,
  userProfiles,
};
