import { container } from 'tsyringe';

import { UserProfileService } from '@~/features/user-profile/user-profile.service';

export default async function userProfileLoader() {
  // Resolve and initialize the service (which will register event listeners)
  container.resolve(UserProfileService);
}
