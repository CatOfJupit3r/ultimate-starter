import { singleton } from 'tsyringe';

import type { userProfiles } from '@~/db/schema/user-profile.schema';
import { createRowResolver } from '@~/lib/row-resolver';

import type { iUserProfileResponse } from './user.types';

type UserProfileRow = typeof userProfiles.$inferSelect;

@singleton()
export class UserProfileResolver {
  public toUserProfileResponse = createRowResolver<UserProfileRow, iUserProfileResponse>();
}
