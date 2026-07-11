import {
  accounts,
  accountsRelations,
  sessions,
  sessionsRelations,
  users,
  usersRelations,
  verifications,
} from './schema/auth.schema';
import { userAchievements } from './schema/user-achievement.schema';
import { userProfiles } from './schema/user-profile.schema';

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
